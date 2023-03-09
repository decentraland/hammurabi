import type * as BABYLON from '@babylonjs/core'
import future, { IFuture } from 'fp-future'
import { Entity } from '../../decentraland/types'

import { EngineApiInterface } from '../../decentraland/scene/types'
import { CrdtMessageType, readAllMessages } from '../../decentraland/crdt-wire-protocol'
import { ByteBuffer, ReadWriteByteBuffer } from '../../decentraland/ByteBuffer'
import { MaybeUint8Array } from '../../quick-js'
import { coerceMaybeU8Array } from '../../quick-js/convert-handles'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'
import { BabylonEntity } from './entity'
import { transformSerde, TRANSFORM_COMPONENT_ID } from '../../decentraland/sdk-components/transform'
import { createLwwStoreFromSerde } from '../../decentraland/crdt-internal/last-write-win-element-set'
import { ComponentDefinition } from '../../decentraland/crdt-internal/components'
import { resolveCyclicParening } from '../../decentraland/sdk-components/cyclic-transform'

export class SceneContext implements EngineApiInterface {
  entities = new Map<Entity, BabylonEntity>()
  #ref = new WeakRef(this)
  rootNode: BabylonEntity

  // this future is resolved when the scene is disposed
  readonly stopped = future<void>()

  // after the "tick" is completed, resolving the futures will send back the CRDT
  // updates to the scripting scene
  nextFrameFutures: Array<IFuture<{ data: Array<Uint8Array> }>> = []
  // stash of incoming CRDT messages from the scripting scene, processed using a
  // quota each renderer frame. ByteBuffer reading is continuable using iterators.
  incomingMessages: ByteBuffer[] = []
  // stash of outgoing messages ready to be sent to back to the scripting scene
  outgoingMessagesBuffer: ByteBuffer = new ReadWriteByteBuffer()

  components: Record<number, ComponentDefinition<any>> = {
    [TRANSFORM_COMPONENT_ID]: createLwwStoreFromSerde(TRANSFORM_COMPONENT_ID, transformSerde)
  }

  // this flag is changed every time an entity changed its parent. the change
  // in the hierarchy is not immediately applied, instead, it should be queued
  // in the unparentedEntities set. Once there, at the end of the "tick", the
  // scene will perform all possible acyclic updates of entities to prevent
  // breaking the Babylon's hierarcy and generating stack overflows while calculating
  // the world matrix of the entitiesg
  hierarchyChanged: boolean = false
  unparentedEntities = new Set<Entity>

  constructor(public babylonScene: BABYLON.Scene, public loadableScene: LoadableScene) {
    this.rootNode = this.getOrCreateEntity(0)

    // add this scene to the update loop of the rendering engine
    babylonScene.getEngine().onBeginFrameObservable.add(this.update)
    babylonScene.getEngine().onEndFrameObservable.add(this.lateUpdate)
  }

  removeEntity(entityId: Entity) {
    const entity = this.getEntityOrNull(entityId)
    if (entity) {
      entity.dispose()
      this.entities.delete(entityId)
      this.unparentedEntities.delete(entityId)
    }
  }

  getOrCreateEntity(entityId: Entity): BabylonEntity {
    let entity = this.entities.get(entityId)
    if (!entity) {
      entity = new BabylonEntity(entityId, this.#ref)
      // every new entity is parented to the scene's rootEntity by default
      entity.parent = this.rootNode
      this.entities.set(entityId, entity)
    }
    return entity
  }

  getEntityOrNull(entityId: Entity): BabylonEntity | null {
    return this.entities.get(entityId) || null
  }

  /**
   * The "update" function handles all the incoming messages from the scene and
   * applies the changes to the renderer entities.
   * 
   * This function is declared as a property to be added and removed to the
   * rendering engine without binding the SceneContext object.
   */
  readonly update = async () => {
    // process all the incoming messages
    while (this.incomingMessages.length) {
      const message = this.incomingMessages[0]

      for (const crdtMessage of readAllMessages(message)) {
        // STUB create or delete entities based on putComponent and deleteEntity
        switch (crdtMessage.type) {
          case CrdtMessageType.DELETE_COMPONENT:
          case CrdtMessageType.PUT_COMPONENT: {
            const entity = this.getOrCreateEntity(crdtMessage.entityId)
            const component = this.components[crdtMessage.componentId]

            // if the change is accepted, then we instruct the entity to update its internal state
            // via putComponent or deleteComponent calls
            if (component && component.updateFromCrdt(crdtMessage, this.outgoingMessagesBuffer)) {
              if (crdtMessage.type === CrdtMessageType.PUT_COMPONENT)
                entity.putComponent(component)
              else
                entity.deleteComponent(component)
            }

            break
          }
          case CrdtMessageType.DELETE_ENTITY: {
            this.removeEntity(crdtMessage.entityId)
            break
          }
        }

        // TODO: implement quota based processing as suggested in ADR-148
        const quotaExceeded = false

        // if we exceeded the quota, finish the processing of this "message" and yield
        // the execution control back to the event loop
        if (quotaExceeded) return
      }

      // at this point, the whole "message" was consumed, we proceed to its removal
      this.incomingMessages.shift()

      // this process resolves the re parenting of all entities preventing cycles
      resolveCyclicParening(this)
    }
  }

  /**
   * lateUpdate should run in each frame AFTER the physics are processed. This is described
   * in ADR-148.
   * 
   * The lateUpdate function is declared as a property to be added and removed to the
   * rendering engine without binding the SceneContext object.
   */
  readonly lateUpdate = async () => {
    const outMessages: Uint8Array[] = []

    // TODO: Execute raycasts into this.outgoingMessages
    // TODO: Execute queries into this.outgoingMessages
    // TODO: Collect events into this.outgoingMessages

    if (this.outgoingMessagesBuffer.currentWriteOffset()) {
      outMessages.push(this.outgoingMessagesBuffer.toBinary())
      this.outgoingMessagesBuffer.incrementWriteOffset(-this.outgoingMessagesBuffer.currentWriteOffset())
      this.outgoingMessagesBuffer.incrementReadOffset(-this.outgoingMessagesBuffer.currentReadOffset())
    }

    // write all the CRDT updates in the outgoingMessagesBuffer
    for (const i in this.components) {
      this.components[i].getCrdtUpdates(this.outgoingMessagesBuffer)
    }

    // finally resolve the future so the function "receiveBatch" is unblocked
    // and the next scripting frame is allowed to happen
    this.nextFrameFutures.forEach((fut) => fut.resolve({ data: outMessages }))

    // finally clean the futures
    this.nextFrameFutures.length = 0
  }

  dispose() {
    this.stopped.resolve()

    for (const [entityId] of this.entities) {
      this.removeEntity(entityId)
    }
    this.rootNode.parent = null
    this.rootNode.dispose()

    // remove this scene from the rendering update loop
    this.babylonScene.getEngine().onBeginFrameObservable.removeCallback(this.update)
    this.babylonScene.getEngine().onEndFrameObservable.removeCallback(this.lateUpdate)
  }

  // impl EngineApiInterface {
  async crdtGetState(): Promise<{ data: Uint8Array[] }> {
    return { data: [] }
  }
  async crdtSendToRenderer(payload: { data: MaybeUint8Array }): Promise<{ data: Uint8Array[] }> {
    const incoming = coerceMaybeU8Array(payload.data)

    if (incoming.byteLength) {
      this.incomingMessages.push(new ReadWriteByteBuffer(incoming))
    }

    // create a future to wait until all the messages are processed. even if there
    // are no updates, we must return the future for CRDT updates like the camera
    // position
    const fut = future<{ data: Uint8Array[] }>()
    this.nextFrameFutures.push(fut)
    return fut
  }
  // }
}