import { Quaternion, Vector3, Scene } from "@babylonjs/core"
import { ReadWriteByteBuffer } from "../ByteBuffer"
import { ComponentDefinition } from "../crdt-internal/components"
import { createGenerationalIndexPool } from "../crdt-internal/generational-index-pool"
import { createLwwStore } from "../crdt-internal/last-write-win-element-set"
import { playerIdentityDataComponent } from "../sdk-components/engine-info copy"
import { transformComponent } from "../sdk-components/transform-component"
import { Entity } from "../types"
import { Emitter } from "mitt"
import { VirtualScene } from "../virtual-scene"
import { CommsEvents } from "./CommsTransportWrapper"
import { MAX_RESERVED_ENTITY, entityIsInRange } from "../../babylon/scene/logic/static-entities"
import { SceneContext } from "../../babylon/scene/scene-context"
import { BabylonEntity } from "../../babylon/scene/entity"
import { avatarShapeComponent } from "../sdk-components/avatar-shape"
import { EntityUtils } from "../crdt-internal/generational-index-pool"

const AVATAR_ENTITY_RANGE: [number, number] = [128, MAX_RESERVED_ENTITY]

export class AvatarEntityReference {
  constructor(public parentAvatar: WeakRef<BabylonEntity>) { }
}

export function uniqueAvatarId(sceneId: number, entity: Entity) {
  // avatar ids are in the range [128, 512) and are considered unique
  if (entityIsInRange(entity, AVATAR_ENTITY_RANGE)) {
    const [entityNumber] = EntityUtils.fromEntityId(entity)
    return `${entityNumber}`
  }
  // on the contrary, every other entity is considered unique per scene
  return `${sceneId}:${entity}`
}

export function createAvatarRendererSystem(scene: Scene, getScenes: () => Iterable<SceneContext>) {
  const avatarEntities = new Map<string, AvatarEntityReference>()

  function avatarShapeSystem() {
    const avatars = new Map<string, Array<BabylonEntity>>()
    const materializedScenes = Array.from(getScenes())

    // look for all avatars from all runnning scenes
    function addAvatar(key: string, avatar: BabylonEntity) {
      const list = avatars.get(key)
      if (list) {
        list.push(avatar)
      } else {
        avatars.set(key, [avatar])
      }
    }

    // iterate over all running scenes and their AvatarShape. get a unique id
    // for each avatar and add them to a list
    for (const scene of materializedScenes) {
      const AvatarShape = scene.components[avatarShapeComponent.componentId]
      for (const [entity] of AvatarShape.iterator()) {
        const avatar = scene.entities.get(entity)
        if (avatar) {
          addAvatar(uniqueAvatarId(scene.id, entity), avatar)
        }
      }
    }

    // =========================================================================
    const finalAvatars = new Map<string, BabylonEntity>()

    // then filter by priority and deduplicate results. we consider a duplicated result
    // any entity that is present in more than one scene and it is within the range of
    // reserved entities for avatars (128 to 512)
    for (const [_id, list] of avatars) {
      // TODO, we render everything for now picking the first one
      const [first, ...rest] = list
      
      finalAvatars.set(_id, first)
      first.appliedComponents.avatarVisible = true

      for (const avatar of rest) {
        avatar.appliedComponents.avatarVisible = false
      }
    }

    // =========================================================================
    // finally, render the avatars into objects. first removing the entities
    // that don't exist anymore and then adding the new ones

    //   delete old ones
    for (const [id] of avatarEntities) {
      if (!finalAvatars.has(id)) {
        avatarEntities.delete(id)
      }
    }

    //   create new ones
    for (const [id, avatar] of finalAvatars) {
      const existing = avatarEntities.get(id)
      if (!existing) {
        avatarEntities.set(id, new AvatarEntityReference(new WeakRef(avatar)))
      } else {
        existing.parentAvatar = new WeakRef(avatar)
      }
    }
    // =========================================================================
  }

  scene.onAfterRenderObservable.add(() => {
    avatarShapeSystem()
  })
}

export function createAvatarVirtualScene(): VirtualScene {
  // reserve entity numbers from 128 to 512 for avatars
  const entityPool = createGenerationalIndexPool(AVATAR_ENTITY_RANGE[0], AVATAR_ENTITY_RANGE[1])

  const PlayerIdentityData = createLwwStore(playerIdentityDataComponent)
  const Transform = createLwwStore(transformComponent)
  const listOfComponentsToSynchronize: ComponentDefinition<any>[] = [PlayerIdentityData, Transform]

  function wireTransportEvents(events: Emitter<CommsEvents>) {
    events.on('PEER_DISCONNECTED', (event) => {
      const entity = findPlayerEntityByAddress(event.address, false)
      if (entity) {
        removePlayerEntity(entity)
      }
    })
    events.on('position', (event) => {
      const entity = findPlayerEntityByAddress(event.address, true)
      if (entity) {
        Transform.createOrReplace(entity, {
          position: new Vector3(event.data.positionX, event.data.positionY, event.data.positionZ),
          scale: Vector3.One(),
          rotation: new Quaternion(event.data.rotationX, event.data.rotationY, event.data.rotationZ, event.data.rotationW),
          parent: 5 // the entity 5 is an entity transformed to the global coordinate system. always having the 0,0,0 at the real 0,0,0
        })
      }
    })

    // transport.events.on('profileMessage', (event) => unwrapPromise(receiveProfileAnnounce(event, scene, transport)))
    // transport.events.on('profileRequest', (event) => unwrapPromise(receiveProfileRequest(event, scene, transport)))
    // transport.events.on('profileResponse', (event) => unwrapPromise(receiveProfileResponse(event, scene, transport)))
  }

  function removePlayerEntity(entity: Entity) {
    for (const component of listOfComponentsToSynchronize) {
      component.entityDeleted(entity, true)
    }
    entityPool.deleteEntity(entity)
  }

  // this is the worst performing way of creating this mapping, but it's the 
  // easiest and cleanest to implement without making wrong assumptions right now
  function findPlayerEntityByAddress(address: string, createIfMissing: boolean): Entity | null {
    for (const [entity, value] of PlayerIdentityData.iterator()) {
      if (value.address === address) {
        return entity
      }
    }

    if (!createIfMissing) return null

    if (!entityPool.hasFreeEntities()) return null

    const entity = entityPool.getFreeEntity()
    PlayerIdentityData.createOrReplace(entity, { address })
    return entity
  }

  return {
    range: AVATAR_ENTITY_RANGE,
    wireTransportEvents,
    runTick() {
      const updates = new ReadWriteByteBuffer()
      entityPool.runTick()
      for (const component of listOfComponentsToSynchronize) {
        // even though "updates" is not used, we need to call this function to commit
        // the updates and clean the dirty iterator of the component.
        component.dumpCrdtUpdates(updates)
      }
    },
    createSubscription() {
      // this is the list of components we are going to synchronize with this subscription
      const state = new Map<ComponentDefinition<any>, number>(listOfComponentsToSynchronize.map(component => [component, 0]))
      let entityPoolTick = 0

      return {
        range: AVATAR_ENTITY_RANGE,
        dispose() {
          state.clear()
        },
        getUpdates(writer) {
          // write updates about deleted entities
          entityPoolTick = entityPool.getCrdtUpdates(writer, entityPoolTick)

          // serialize all the updates from the last tick until now. then
          // store the new tick for the next round
          for (const [component, tick] of state) {
            const newTick = component.dumpCrdtDeltas(writer, tick)
            state.set(component, newTick)
          }
        },
      }
    }
  }
}
