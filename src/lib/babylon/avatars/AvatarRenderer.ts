import { AssetContainer, InstantiatedEntries, MeshBuilder, Scene, StandardMaterial, Texture, TransformNode } from "@babylonjs/core";
import { PBAvatarShape } from "@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen";
import { BabylonEntity } from "../scene/entity";
import { memoize } from "../../misc/memoize";
import { createLoadableAvatarConfig } from "./loader";
import { LoadableAvatarConfig } from "./babylon/types";
import { Asset } from "./babylon/scene";
import { BodyShape } from "@dcl/schemas";
import { getFacialFeatures, applyFacialFeatures } from "./babylon/face";
import { getSlots } from "./babylon/slots";
import { isModelLoader, isSuccesful, isFacialFeatureLoader } from "./babylon/utils";
import { loadWearable } from "./babylon/wearable";
import { getBodyShape } from "./babylon/body";
import { instantiateAssetContainer } from "../scene/AssetManager";
import { isBodyShape } from "./urn";

const capsule = memoize((scene: Scene) => {
  const ret = MeshBuilder.CreateCapsule(
    'base-capsule',
    {
      updatable: false
    },
    scene
  )
  const material = new StandardMaterial(
    'base-box',
    scene
  )
  material.diffuseTexture = new Texture('images/UV_checker_Map_byValle.jpg')
  ret.material = material
  ret.setEnabled(false)
  return ret
})

export class AvatarRenderer extends TransformNode {
  visible = true

  instances = new Map<string, InstantiatedEntries>()

  constructor(private entity: BabylonEntity) {
    super('AvatarRenderer', entity.getScene())
  }

  setAvatarShape(shape: PBAvatarShape) {
    // loadAvatar(entity.getScene(), newValue)
    // const realm = 
    createLoadableAvatarConfig(shape, 'https://peer.decentraland.org/content', this.getScene()).then(config => {
      this.loadModelsFromConfig(config)
    })
  }

  applyCustomizations() {

  }

  async loadModelsFromConfig(config: LoadableAvatarConfig) {
    // create the root scene
    // load all the wearables into the root scene
    const promises: Promise<Asset | void>[] = []

    // get slots
    const slots = getSlots(config)

    // get wearables
    const loaders = Array.from(slots.values())

    for (const loader of loaders.filter($ => isModelLoader($))) {
      const promise = loadWearable(loader, config).catch((error) => {
        console.warn(error.message)
      })
      promises.push(promise)
    }

    const assets = (await Promise.all(promises)).filter(isSuccesful)

    this.removeCurrentModels()

    // add all assets to scene
    for (const asset of assets) {
      const instances = instantiateAssetContainer(asset.container, this, this.entity)
      this.instances.set(asset.wearable.id, instances)
    }

    // apply customizations
    for (const [_, instances] of this.instances) {
      // build avatar
      const bodyShape = getBodyShape(assets, instances)

      if (bodyShape) {
        // apply facial features
        const features = loaders.filter(isFacialFeatureLoader)
        const { eyes, eyebrows, mouth } = await getFacialFeatures(features, config.bodyShape ?? BodyShape.FEMALE)
        applyFacialFeatures(this.getScene(), bodyShape, eyes, eyebrows, mouth, config)
      }
    }

    // play emote
    // const emoteController = (await playEmote(scene, assets, config)) || createInvalidEmoteController() // default to invalid emote controller if there is an issue with the emote, but let the rest of the preview keep working
    // const emoteController = (await playEmote(scene, assets, config)) || createInvalidEmoteController() // default to invalid emote controller if there is an issue with the emote, but let the rest of the preview keep working

    // return preview controller
    // const controller: IPreviewController = {
    //   scene: sceneController,
    //   emote: emoteController,
    // }

    // return controller
  }

  removeCurrentModels() {
    this.instances.forEach($ => $.dispose())
    this.instances.clear()
  }

  dispose() {
    this.removeCurrentModels()
    super.dispose()
  }
}