import type * as BABYLON from '@babylonjs/core'
import future, { IFuture } from 'fp-future'
import { Entity } from '../../decentraland/types'

// temporarily, we will use a TransformNode as a placeholder for our BabylonEntity class
import { TransformNode as BabylonEntity } from '@babylonjs/core'
import { EngineApiInterface } from '../../decentraland/scene/types'
import { CrdtMessageType, readAllMessages } from '../../decentraland/crdt-wire-protocol'
import { ByteBuffer, ReadWriteByteBuffer } from '../../decentraland/ByteBuffer'
import { prettyPrintCrdtMessage } from '../../decentraland/crdt-wire-protocol/prettyPrint'
import { MaybeUint8Array } from '../../quick-js'
import { coerceMaybeU8Array } from '../../quick-js/convert-handles'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'

export class SceneContext implements EngineApiInterface {
  entities = new Map<Entity, BABYLON.TransformNode>()
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

  constructor(public babylonScene: BABYLON.Scene, public loadableScene: LoadableScene) {
    this.rootNode = new BabylonEntity('root entity', babylonScene)

    // add this scene to the update loop of the rendering engine
    babylonScene.getEngine().onBeginFrameObservable.add(this.update)
    babylonScene.getEngine().onEndFrameObservable.add(this.lateUpdate)
  }

  removeEntity(entityId: Entity) {
    const entity = this.getEntityOrNull(entityId)
    if (entity) {
      entity.dispose()
      this.entities.delete(entityId)
    }
  }

  getOrCreateEntity(entityId: Entity): BabylonEntity {
    let entity = this.entities.get(entityId)
    if (!entity) {
      entity = new BabylonEntity(entityId.toString(), this.babylonScene)
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
        // STUB, in this part of the code, we are supposed to update all the components
        console.log('CRDT message', prettyPrintCrdtMessage(crdtMessage))

        // STUB create or delete entities based on putComponent and deleteEntity
        switch (crdtMessage.type) {
          case CrdtMessageType.PUT_COMPONENT: {
            const _entity = this.getOrCreateEntity(crdtMessage.entityId)
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