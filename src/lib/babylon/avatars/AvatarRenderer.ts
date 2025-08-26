import { AbstractMesh, InstantiatedEntries, Matrix, Mesh, MeshBuilder, Plane, ThinTexture, TransformNode, Vector3 } from "@babylonjs/core";
import { PBAvatarShape } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_shape.gen";
import { PBAvatarBase } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_base.gen";
import { BabylonEntity } from "../scene/BabylonEntity";
import { createLoadableAvatarConfig } from "./loader";
import { AvatarShapeWithAssetManagers, EmoteWithContainer, WearableWithContainer } from "./adr-65/types";
import { BodyShape } from "@dcl/schemas";
import { getFacialFeatures, applyFacialFeaturesToMeshes, applySkinMaterialsToInstances } from "./adr-65/customizations";
import { getVisibleSlots } from "./adr-65/slots";
import { isWearableFacialFeatureLoader } from "./adr-65/utils";
import { loadEmoteForBodyShape, loadWearableForBodyShape } from "./adr-65/loader";
import { getBodyShapeAndHideBodyParts } from "./adr-65/body";
import { instantiateAssetContainer } from "../scene/AssetManager";
import { createLogger } from "../../misc/logger";
import { BabylonEmote, createEmote } from "./adr-65/emote";
import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import { PLAYER_HEIGHT } from "../scene/logic/static-entities";

const avatarRendererLogger = createLogger('AvatarRenderer')

const WALK_SPEED_METERS_PER_SECOND = 3
const MILLISECOND_DAMPENING_WINDOW = 300
const tmpVector = new Vector3()

function deriveCurrentAnimationState(userDefinedAnimation: string | void, speed: number, distanceToTheFloor: number) {
  // if (distanceToTheFloor > 0.01)
  //   return 'jump'

  if (speed <= 0.1) {
    return userDefinedAnimation || 'idle'
  }

  if (speed < WALK_SPEED_METERS_PER_SECOND) {
    return 'walk'
  } else {
    return 'run'
  }
}

type PositionRecord = {
  when: number
  position: Vector3
}

export class AvatarRenderer extends TransformNode {
  visible = true
  instances = new Map<string, InstantiatedEntries>()
  emotes = new Map<string, BabylonEmote>()

  desiredEmote: string | void = undefined

  previousPlayingEmote = 'none'
  deltaMovementSpeed = Vector3.Zero() // normalized to 1 meter per second
  previousAbsolutePosition = Vector3.Zero()
  headingAngle = 0
  lastPositionCommands: PositionRecord[] = []
  labelPlane: Mesh;
  texture?: AdvancedDynamicTexture;
  textBlock?: TextBlock;

  constructor(private entity: BabylonEntity) {
    super('AvatarRenderer', entity.getScene())

    this.labelPlane = MeshBuilder.CreatePlane(
      'text-plane',
      { width: 2, height: 0.125 },
      entity.getScene()
    )

    // Skip UI creation in headless environment
    if (typeof OffscreenCanvas !== 'undefined') {
      this.texture = AdvancedDynamicTexture.CreateForMesh(
        this.labelPlane,
        512,
        32,
        false
      )
    }

    // Skip UI creation in headless environment
    if (typeof OffscreenCanvas !== 'undefined') {
      this.textBlock = new TextBlock()
    }

    this.labelPlane.position.y = PLAYER_HEIGHT + 0.125 * 3
    this.labelPlane.parent = this
    this.labelPlane.billboardMode = 7

    // Configure text styling only if textBlock exists
    if (this.textBlock) {
      this.textBlock.fontWeight = '700'
      this.textBlock.outlineColor = '#6ef759'
      this.textBlock.outlineWidth = 1
      this.textBlock.color = '#572a21'
    }

    const originalF = this.labelPlane.isInFrustum

    this.labelPlane.isInFrustum = function (this: AbstractMesh, frustumPlanes: Plane[]): boolean {
      if (this.absolutePosition) {
        const distanceToObject = tmpVector.copyFrom(this.absolutePosition).subtract(this.getScene().activeCamera!.position).length()

        // cull out labels farther than 30meters
        if (distanceToObject > 5)
          return false
      }

      return originalF.call(this, frustumPlanes)
    }

    // Skip UI setup in headless environment
    if (this.texture && this.textBlock) {
      this.texture.addControl(this.textBlock)
    }
  }

  // This function is called after Babylon calculates the world matrix of the entity
  // we hook into this lifecycle event to mutate the final _worldMatrix before it is
  // settled
  _afterComputeWorldMatrix() {
    const camera = this.getScene().activeCamera
    const now = performance.now()

    if (camera) {
      // save translation and scaling components of the world matrix calculated by Babylon
      const position = Vector3.Zero()
      const scale = Vector3.One()
      this._worldMatrix.decompose(scale, undefined, position)

      // calculate the LookAt matrix from the direction vector towards zero
      const rotMatrix = Matrix.Identity()

      // reset the rotation
      Matrix.RotationYawPitchRollToRef(this.headingAngle, 0, 0, rotMatrix);

      // restore the scale to a blank scaling matrix
      const scalingMatrix = Matrix.Scaling(scale.x, scale.y, scale.z);

      // apply the scale to the rotation matrix, into _worldMatrix
      scalingMatrix.multiplyToRef(rotMatrix, this._worldMatrix)

      // finally restore the translation into _worldMatrix
      this._worldMatrix.setTranslation(position);
      this.absolutePosition.copyFrom(position);
    }

    const r = super._afterComputeWorldMatrix()

    this.deltaMovementSpeed.copyFrom(this.previousAbsolutePosition).subtractInPlace(this.absolutePosition)
    this.deltaMovementSpeed.scaleInPlace(1000 / this.getScene().getEngine().getDeltaTime())
    this.previousAbsolutePosition.copyFrom(this.absolutePosition)

    this.lastPositionCommands.push({ position: this.absolutePosition.clone(), when: now })

    if (this.deltaMovementSpeed.length() > 0.05) {
      this.headingAngle = Math.atan2(this.deltaMovementSpeed.x, this.deltaMovementSpeed.z) + Math.PI;
    }

    // remove records older than 0.2 second
    while (this.lastPositionCommands.length) {
      const record = this.lastPositionCommands[0]
      if (record.when < now - MILLISECOND_DAMPENING_WINDOW) {
        this.lastPositionCommands.shift()
      } else {
        break
      }
    }

    this.updateStateMachine()

    return r
  }

  // this function should return false if the world matrix needs to be recalculated
  // it is called internally by Babylon.js internal code
  _isSynchronized() {
    return false
  }

  updateStateMachine() {
    const { time, distance } = this.lastPositionCommands.reduce((acc, curr, index) => {
      if (index === 0) return acc
      acc.time += curr.when - this.lastPositionCommands[index - 1].when
      acc.distance += curr.position.subtract(this.lastPositionCommands[index - 1].position).length()
      return acc
    }, { time: 0, distance: 0 })

    const speed = distance / (time / 1000)

    const currentDesiredEmote = deriveCurrentAnimationState(this.desiredEmote, speed, this.absolutePosition.y)

    if (this.previousPlayingEmote !== currentDesiredEmote) {
      const currentEmote = this.emotes.get(currentDesiredEmote)

      this.emotes.get(this.previousPlayingEmote)?.animationGroup.stop()
      currentEmote?.animationGroup.start(currentEmote.emote.emoteDataADR74.loop)
      currentEmote?.animationGroup.onAnimationGroupEndObservable.addOnce(() => {
        if (this.desiredEmote === currentDesiredEmote) {
          this.desiredEmote = undefined
        }
      })

      this.previousPlayingEmote = currentDesiredEmote
    }
  }

  // play an emote by name or URN, returns true if the emote exists
  playEmote(name: string): boolean {
    if (this.emotes.has(name)) {
      this.desiredEmote = name
      return true
    } else {
      this.desiredEmote = undefined
      return false
    }
  }

  currentShape: PBAvatarShape | null = null
  currentAvatarBase: PBAvatarBase | null = null

  setAvatarShape(shape: PBAvatarShape) {
    if (this.currentShape == shape) return

    // TODO: this information is present in the realm definition (AboutResponse#content.publicUrl)
    const contentServerBaseUrl = 'https://peer.decentraland.org/content'

    if (this.textBlock) {
      this.textBlock.text = shape.name || ''
    }
    this.currentShape = shape

    createLoadableAvatarConfig(shape, contentServerBaseUrl, this.getScene())
      .then(config => {
        if (shape === this.currentShape) {
          return this.loadModelsFromConfig(config)
        }
      })
      .catch(avatarRendererLogger.error)
  }

  updateAvatarBase(avatarBase: PBAvatarBase) {
    if (this.currentAvatarBase === avatarBase) return
    
    this.currentAvatarBase = avatarBase
    if (this.textBlock) {
      this.textBlock.text = avatarBase.name || ''
    }
    
    // Create a PBAvatarShape from AvatarBase data for compatibility with existing loading system
    const fakeAvatarShape: PBAvatarShape = {
      id: avatarBase.bodyShapeUrn || '',
      bodyShape: avatarBase.bodyShapeUrn || '',
      wearables: [], // Will be populated if needed
      emotes: [],
      eyeColor: avatarBase.eyesColor,
      hairColor: avatarBase.hairColor,
      skinColor: avatarBase.skinColor,
      name: avatarBase.name || ''
    }
    
    // Use existing avatar loading system with converted data
    this.setAvatarShape(fakeAvatarShape)
  }

  async loadModelsFromConfig(config: AvatarShapeWithAssetManagers) {
    const bodyShape = config.bodyShape ?? BodyShape.FEMALE

    // get slots
    const slots = getVisibleSlots(config)

    // get wearables
    const loaders = Array.from(slots.values())

    const loadWearablePromises = loaders.map(loader =>
      loadWearableForBodyShape(loader, bodyShape).catch(avatarRendererLogger.error)
    )

    // Skip emote loading in headless environment
    const loadEmotePromises = typeof OffscreenCanvas !== 'undefined' 
      ? config.loadedEmotes.map(loader =>
          loadEmoteForBodyShape(loader, bodyShape).catch(avatarRendererLogger.error)
        )
      : []

    const assets = (await Promise.all(loadWearablePromises)).filter(Boolean) as WearableWithContainer[]

    this.removeCurrentModels()

    // add all assets to scene
    for (const asset of assets) {
      const instances = instantiateAssetContainer(asset.container, this, this.entity)
      // cleanupEmptyNodes(instances)
      this.instances.set(asset.wearable.id, instances)
    }

    // apply customizations
    for (const [_, instances] of this.instances) {
      applySkinMaterialsToInstances(instances, config)

      // build avatar
      const bodyShapeContainer = getBodyShapeAndHideBodyParts(assets, instances)

      if (bodyShapeContainer) {
        // apply facial features
        const features = loaders.filter(isWearableFacialFeatureLoader)
        const { eyes, eyebrows, mouth } = await getFacialFeatures(features, bodyShape)
        applyFacialFeaturesToMeshes(this.getScene(), instances, eyes, eyebrows, mouth, config)
      }
    }

    // create emotes for the recently instantiated wearables meshes
    const emotes = (await Promise.all(loadEmotePromises)).filter(Boolean) as EmoteWithContainer[]

    const prefix = `${this.entity.context.deref()?.loadableScene.urn}-${this.entity.entityId.toString(16)}-`

    for (const emote of emotes) {
      const controller = createEmote(prefix, emote, this.instances.values())
      if (controller) {
        this.emotes.set(emote.emote.id, controller)
      }
    }

    this.previousPlayingEmote = ''
    this.desiredEmote = undefined
  }

  removeCurrentModels() {
    this.emotes.forEach($ => $.animationGroup.dispose())
    this.instances.forEach($ => $.dispose())
    this.instances.clear()
    this.emotes.clear()
    this.previousPlayingEmote = ''
    this.desiredEmote = undefined
  }

  dispose() {
    this.removeCurrentModels()
    super.dispose()
  }
}
