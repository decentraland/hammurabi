import { Quaternion, Vector3 } from "@babylonjs/core"
import { ReadWriteByteBuffer } from "../ByteBuffer"
import { ComponentDefinition } from "../crdt-internal/components"
import { createGenerationalIndexPool } from "../crdt-internal/generational-index-pool"
import { createLwwStore } from "../crdt-internal/last-write-win-element-set"
import { playerIdentityDataComponent } from "../sdk-components/player-identity-data"
import { transformComponent } from "../sdk-components/transform-component"
import { Entity } from "../types"
import { VirtualScene } from "../virtual-scene"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { AVATAR_ENTITY_RANGE } from "../../babylon/scene/logic/static-entities"
import { Avatar } from "@dcl/schemas"
import { unwrapPromise } from "../../misc/promises"
import { avatarCustomizationsComponent, avatarEquippedDataComponent } from "../sdk-components/avatar-customizations"

export function createAvatarVirtualSceneSystem(getTransports: () => Iterable<CommsTransportWrapper>): VirtualScene {
  // reserve entity numbers from 128 to 512 for avatars
  const entityPool = createGenerationalIndexPool(AVATAR_ENTITY_RANGE[0], AVATAR_ENTITY_RANGE[1])

  const PlayerIdentityData = createLwwStore(playerIdentityDataComponent)
  const AvatarCustomizations = createLwwStore(avatarCustomizationsComponent)
  const AvatarEquippedData = createLwwStore(avatarEquippedDataComponent)
  const Transform = createLwwStore(transformComponent)
  const listOfComponentsToSynchronize: ComponentDefinition<any>[] = [PlayerIdentityData, AvatarCustomizations, AvatarEquippedData, Transform]

  const localAvatars = new Map<string, Avatar>()

  function normalizeAddress(address: string) {
    return address.toLowerCase()
  }

  const connectedTransports = new WeakSet<CommsTransportWrapper>()

  function wireTransportEvents(transport: CommsTransportWrapper) {
    connectedTransports.add(transport)
    transport.events.on('PEER_DISCONNECTED', (event) => {
      const entity = findPlayerEntityByAddress(event.address, false)
      if (entity) {
        removePlayerEntity(entity)
      }
    })
    transport.events.on('position', (event) => {
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
    transport.events.on('profileMessage', (event) => {
      const address = normalizeAddress(event.address)
      const localAvatar = localAvatars.get(address)
      const shouldRequestNewVersion = !localAvatar || localAvatar!.version < event.data.profileVersion

      if (shouldRequestNewVersion) {
        unwrapPromise(transport.sendProfileRequest({ address: event.address, profileVersion: event.data.profileVersion }))
      }
    })
    transport.events.on('profileResponse', (event) => {
      const address = normalizeAddress(event.address)
      const localAvatar = localAvatars.get(address)
      const serialized: Avatar = JSON.parse(event.data.serializedProfile)
      if (!Avatar.validate(serialized)) {
        console.error('Invalid avatar info received', serialized, Avatar.validate.errors)
      }
      const shouldUpdateAvatarData = !localAvatar || localAvatar!.version < serialized.version

      if (shouldUpdateAvatarData) {
        localAvatars.set(address, serialized)
        const entity = findPlayerEntityByAddress(event.address, true)
        if (entity) {
          AvatarCustomizations.createOrReplace(entity, {
            bodyShapeUrn: serialized.avatar.bodyShape,
            eyesColor: serialized.avatar.eyes.color,
            hairColor: serialized.avatar.hair.color,
            skinColor: serialized.avatar.skin.color
          })
          AvatarEquippedData.createOrReplace(entity, {
            emotes: (serialized.avatar.emotes ?? []).map($ => $.urn),
            urns: serialized.avatar.wearables ?? []
          })
        }
      }
    })
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
    update() {
      for (const transport of getTransports()) {
        if (!connectedTransports.has(transport))
          wireTransportEvents(transport)
      }

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
