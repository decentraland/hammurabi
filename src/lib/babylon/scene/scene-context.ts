import * as BABYLON from '@babylonjs/core'
import future, { IFuture } from 'fp-future'
import { Entity } from '../../decentraland/types'

import { EngineApiInterface } from '../../decentraland/scene/types'
import { CrdtMessageType, readAllMessages } from '../../decentraland/crdt-wire-protocol'
import { ByteBuffer, ReadWriteByteBuffer } from '../../decentraland/ByteBuffer'
import { LoadableScene, resolveFile, resolveFileAbsolute } from '../../decentraland/scene/content-server-entity'
import { BabylonEntity } from './BabylonEntity'
import { transformComponent } from '../../decentraland/sdk-components/transform-component'
import { createLwwStore } from '../../decentraland/crdt-internal/last-write-win-element-set'
import { ComponentDefinition } from '../../decentraland/crdt-internal/components'
import { resolveCyclicParening } from './logic/cyclic-transform'
import { Vector3 } from '@babylonjs/core'
import { Scene } from '@dcl/schemas'
import { billboardComponent } from '../../decentraland/sdk-components/billboard-component'
import { raycastComponent, raycastResultComponent } from '../../decentraland/sdk-components/raycast-component'
import { meshRendererComponent } from '../../decentraland/sdk-components/mesh-renderer-component'
import { processRaycasts } from './logic/raycasts'
import { meshColliderComponent } from '../../decentraland/sdk-components/mesh-collider-component'
import { PARCEL_SIZE_METERS, gridToWorld, parseParcelPosition } from '../../decentraland/positions'
import { createParcelOutline } from '../visual/parcelOutline'
import { CrdtGetStateResponse, CrdtSendToRendererRequest, CrdtSendToResponse } from '@dcl/protocol/out-js/decentraland/kernel/apis/engine_api.gen'
import { gltfContainerComponent } from '../../decentraland/sdk-components/gltf-component'
import { AssetManager } from './AssetManager'
import { pointerEventsComponent } from '../../decentraland/sdk-components/pointer-events'
import { StaticEntities, entityIsInRange, updateStaticEntities } from './logic/static-entities'
import { animatorComponent } from '../../decentraland/sdk-components/animator-component'
import { engineInfoComponent } from '../../decentraland/sdk-components/engine-info'
import { gltfContainerLoadingStateComponent } from '../../decentraland/sdk-components/gltf-loading-state'
import { LoadingState } from '@dcl/protocol/out-js/decentraland/sdk/components/common/loading_state.gen'
import { pointerEventsResultComponent } from '../../decentraland/sdk-components/pointer-events-result'
import { createValueSetComponentStore } from '../../decentraland/crdt-internal/grow-only-set'
import { VirtualSceneSubscription } from '../../decentraland/virtual-scene'
import { MAX_ENTITY_NUMBER } from '../../decentraland/crdt-internal/generational-index-pool'
import { avatarShapeComponent } from '../../decentraland/sdk-components/avatar-shape'
import { avatarBaseComponent } from '../../decentraland/sdk-components/avatar-base'
import { delayedInterpolationComponent } from '../../decentraland/sdk-components/delayed-interpolation'
import { tweenComponent } from '../../decentraland/sdk-components/tween'
import { materialComponent } from '../../decentraland/sdk-components/material-component'
import { CommsTransportWrapper } from '../../decentraland/communications/CommsTransportWrapper'
import { createAvatarCommunicationSystem, AvatarCommunicationSystem } from '../../decentraland/communications/avatar-communication-system'

const SCENE_ENTITY_RANGE: [number, number] = [1, MAX_ENTITY_NUMBER]

let incrementalId = 0

export class SceneContext implements EngineApiInterface {
  entities = new Map<Entity, BabylonEntity>()
  #ref = new WeakRef(this)
  rootNode: BabylonEntity

  readonly entityId: string

  private _transport?: CommsTransportWrapper
  private _avatarSystem?: AvatarCommunicationSystem
  // this future is resolved when the scene is disposed
  readonly stopped = future<void>()

  readonly metadata: Scene

  // after the "tick" is completed, resolving the futures will send back the CRDT
  // updates to the scripting scene
  nextFrameFutures: Array<IFuture<{ data: Array<Uint8Array> }>> = []
  // stash of incoming CRDT messages from the scripting scene, processed using a
  // quota each renderer frame. ByteBuffer reading is continuable using iterators.
  // the incoming messages also include the range of allowe entities that the origin
  // transports had access to
  incomingMessages: { buffer: ByteBuffer, readonly allowedEntityRange: [number, number] }[] = []

  // stash of outgoing messages ready to be sent to back to the scripting scene
  outgoingMessagesBuffer: ByteBuffer = new ReadWriteByteBuffer()

  // when we finish to process all the income messages of a tick, 
  // set finishedProcessingFrame to true to send the outgoing messages, then to false.
  finishedProcessingIncomingMessagesOfTick: boolean = false

  // the follwing set contains a list of pending raycast queries. if a query is continous,
  // it won't be removed from the set
  pendingRaycastOperations = new Set<Entity>()

  // log function for tests
  log: (...args: any[]) => void = (...args) => console.log(this.rootNode.name, ...args)

  // tick counter for EngineInfo
  currentTick = 0

  // start time for EngineInfo
  readonly startTime = performance.now()
  // start frame for EngineInfo
  readonly startFrame = this.babylonScene.getEngine().frameId

  // contents of the main.crdt file
  mainCrdt = Uint8Array.of()

  components = {
    [transformComponent.componentId]: createLwwStore(transformComponent),
    [billboardComponent.componentId]: createLwwStore(billboardComponent),
    [raycastComponent.componentId]: createLwwStore(raycastComponent),
    [raycastResultComponent.componentId]: createLwwStore(raycastResultComponent),
    [meshRendererComponent.componentId]: createLwwStore(meshRendererComponent),
    [meshColliderComponent.componentId]: createLwwStore(meshColliderComponent),
    [gltfContainerComponent.componentId]: createLwwStore(gltfContainerComponent),
    [pointerEventsComponent.componentId]: createLwwStore(pointerEventsComponent),
    [pointerEventsResultComponent.componentId]: createValueSetComponentStore(pointerEventsResultComponent, {
      maxElements: 10,
      timestampFunction(value) {
        return value.tickNumber
      },
    }),
    [animatorComponent.componentId]: createLwwStore(animatorComponent),
    [gltfContainerLoadingStateComponent.componentId]: createLwwStore(gltfContainerLoadingStateComponent),
    [engineInfoComponent.componentId]: createLwwStore(engineInfoComponent),
    [avatarShapeComponent.componentId]: createLwwStore(avatarShapeComponent),
    [avatarBaseComponent.componentId]: createLwwStore(avatarBaseComponent),
    [tweenComponent.componentId]: createLwwStore(tweenComponent),
    [delayedInterpolationComponent.componentId]: createLwwStore(delayedInterpolationComponent),
    [materialComponent.componentId]: createLwwStore(materialComponent),
  } as const

  // this flag is changed every time an entity changed its parent. the change
  // in the hierarchy is not immediately applied, instead, it should be queued
  // in the unparentedEntities set. Once there, at the end of the "tick", the
  // scene will perform all possible acyclic updates of entities to prevent
  // breaking the Babylon's hierarcy and generating stack overflows while calculating
  // the world matrix of the entitiesg
  hierarchyChanged: boolean = false
  unparentedEntities = new Set<Entity>

  // the assetmanager is used to centralize all the loading/unloading of assets
  // of this scene. 
  assetManager = new AssetManager(this.loadableScene, this.babylonScene)

  // bounding vectors to calculate the distance to the outer bounds of the scene
  // for the throttling mechanism
  boundingBox?: BABYLON.BoundingBox

  // subscriptions to other scene's CRDT updates
  subscriptions: VirtualSceneSubscription[] = []

  subscriptionsBuffer = new ReadWriteByteBuffer()

  // TODO: this should be the optimized data structure to keep track of deleted entities
  // instead of a set
  deletedEntities = new Set<Entity>()
  id: number = incrementalId++

  constructor(public babylonScene: BABYLON.Scene, public loadableScene: LoadableScene, public isGlobalScene: boolean, entityId: string) {
    this.entityId = entityId
    this.rootNode = this.getOrCreateEntity(StaticEntities.RootEntity)
    // the rootNode must be positioned according to the value of the "scenes.base" of the scene metadata (scene.json)
    this.metadata = loadableScene.entity.metadata as Scene
    if (this.metadata.scene?.base) {
      const base = parseParcelPosition(this.metadata.scene.base)
      this.rootNode.name = this.metadata.scene.base
      gridToWorld(base.x, base.y, this.rootNode.position)

      const r = createParcelOutline(babylonScene, this.metadata.scene.base, this.metadata.scene.parcels)
      r.result.parent = this.rootNode

      // position the GlobalCenterOfCoordinates entity
      const GlobalCenterOfCoordinates = this.getOrCreateEntity(StaticEntities.GlobalCenterOfCoordinates)
      GlobalCenterOfCoordinates.position.set(-this.rootNode.position.x, 0, -this.rootNode.position.z)
      GlobalCenterOfCoordinates.parent = this.rootNode
    }

    // calculate a naive bounding box for the scene to calculate the distance to the outer bounds
    // and use that distance to prioritize the message quota for ADR-148
    if (this.metadata.scene?.parcels) {
      let minX: number | null = null
      let minZ: number | null = null
      let maxX: number | null = null
      let maxZ: number | null = null
      for (const position of this.metadata.scene.parcels) {
        const vec = parseParcelPosition(position)
        if (minX == null || vec.x < minX) minX = vec.x
        if (minZ == null || vec.y < minZ) minZ = vec.y
        if (maxX == null || vec.x > maxX) maxX = vec.x
        if (maxZ == null || vec.y > maxZ) maxZ = vec.y
      }

      // as per https://docs.decentraland.org/creator/development-guide/scene-limitations/
      const height = Math.log2(this.metadata.scene.parcels.length + 1) * 20

      if (minX) {
        this.boundingBox = new BABYLON.BoundingBox(
          new Vector3(minX! * PARCEL_SIZE_METERS, -1, minZ! * PARCEL_SIZE_METERS),
          new Vector3((maxX! + 1) * PARCEL_SIZE_METERS, height, (maxZ! + 1) * PARCEL_SIZE_METERS)
        )
      }
    }
  }

  async initAsyncJobs() {
    // load the main.crdt as specified by ADR-133 and ADR-148. the tick number zero
    // is always completed by either the contents of main.crdt or by an empty array
    try {
      const file = 'main.crdt'
      if (resolveFileAbsolute(this.loadableScene, file)) {
        const { content } = await this.readFile(file)
        this.mainCrdt = content
        this.incomingMessages.push({ buffer: new ReadWriteByteBuffer(content), allowedEntityRange: SCENE_ENTITY_RANGE })
      }
    } catch (err: any) {
      this.log(err)
    }
  }

  // this function returns the total elapsed time in seconds since the SceneContext was created
  getElapsedTime() {
    return (performance.now() - this.startTime) / 1000
  }

  // naivest implementation of the distance to the outer bounds of the scene
  distanceToPoint(point: BABYLON.Vector3) {
    if (!this.boundingBox) return 0
    if (this.boundingBox?.intersectsPoint(point)) return 0
    return this.boundingBox?.centerWorld.subtract(point).length()
  }

  removeEntity(entityId: Entity) {
    this.deletedEntities.add(entityId)
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
   * 
   * Returns false if the quota was exceeded. True if there is still time to continue
   * processing more messages, similar to cooperative scheduling.
   */
  update(hasQuota: () => boolean) {
    let rollingOperationCounter = 0

    // process all the incoming messages
    while (this.incomingMessages.length) {
      const message = this.incomingMessages[0]

      for (const crdtMessage of readAllMessages(message.buffer)) {
        if (this.deletedEntities.has(crdtMessage.entityId)) continue
        // STUB create or delete entities based on putComponent and deleteEntity
        switch (crdtMessage.type) {
          case CrdtMessageType.APPEND_VALUE:
          case CrdtMessageType.DELETE_COMPONENT:
          case CrdtMessageType.PUT_COMPONENT: {
            // ignore updates of entities outside range
            // if (!entityIsInRange(crdtMessage.entityId, message.allowedEntityRange)) continue

            const entity = this.getOrCreateEntity(crdtMessage.entityId)
            const component = (this.components as any)[crdtMessage.componentId] as ComponentDefinition<any> | void

            // if the change is accepted, then we instruct the entity to update its internal state
            // via putComponent or deleteComponent calls
            if (component && component.updateFromCrdt(crdtMessage, this.outgoingMessagesBuffer)) {
              if (
                crdtMessage.type === CrdtMessageType.PUT_COMPONENT ||
                crdtMessage.type === CrdtMessageType.APPEND_VALUE
              ) {
                entity.putComponent(component)
              } else {
                entity.deleteComponent(component)
              }
            }

            break
          }
          case CrdtMessageType.DELETE_ENTITY: {
            // ignore updates of entities outside range
            if (!entityIsInRange(crdtMessage.entityId, message.allowedEntityRange)) continue

            this.removeEntity(crdtMessage.entityId)
            break
          }
        }

        // if we exceeded the quota, finish the processing of this "message" and yield
        // the execution control back to the event loop
        if ((++rollingOperationCounter % 10) == 0 && !hasQuota()) {
          return false
        }
      }

      // at this point, the whole "message" was consumed, we proceed to its removal
      this.incomingMessages.shift()

      // this process resolves the re parenting of all entities preventing cycles
      resolveCyclicParening(this)
    }

    // Update avatar system if it exists
    if (this._avatarSystem) {
      this._avatarSystem.update()
    }

    // mark the frame as processed. this signals the lateUpdate to respond to the scene with updates
    this.finishedProcessingIncomingMessagesOfTick = true
    return true
  }

  /**
   * lateUpdate should run in each frame AFTER the physics are processed. This is described
   * in ADR-148.
   * 
   * The lateUpdate function is declared as a property to be added and removed to the
   * rendering engine without binding the SceneContext object.
   */
  lateUpdate() {
    // only emit messages if there are receiver promises
    if (!this.nextFrameFutures.length) return

    // only finalize the frame once the incoming messages were cleared
    if (!this.finishedProcessingIncomingMessagesOfTick) return

    // on the first frame, as per ADR-148, the crdtSendToRenderer should only respond
    // if and only if all assets finished loading to properly process the raycasts
    //
    // to compy with that statement, we early-finalize this procedure if a component is in
    // LOADING state. the engine will catch up and finish the crdtSendToRenderer on the
    // next renderer frame
    if (this.currentTick === 0) {
      const loadingComponents = this.components[gltfContainerLoadingStateComponent.componentId]
      let has = false
      for (const [_entity, component] of loadingComponents.iterator()) {
        has = true
        if (component.currentState === LoadingState.LOADING) {
          this.log(`⌛️ Holding tick#0 processing because of LOADING for scene`)
          return
        }
      }
      if (has) {
        this.log(`✅ All GltfContainerLoadingState went out of LOADING state in tick#0`)
      }
      this.log('\n\n\n\n======================= Starting Scene Logs: ======================= \n\n\n\n')
    }


    const outMessages: Uint8Array[] = []

    processRaycasts(this)

    // TODO: Execute queries into this.outgoingMessages
    // TODO: Collect events into this.outgoingMessages

    // update the components of the static entities to be sent to the scene
    this.updateStaticEntities()

    // write all the CRDT updates in the outgoingMessagesBuffer
    for (const component of Object.values(this.components)) {
      component.dumpCrdtUpdates(this.outgoingMessagesBuffer)
    }

    // forward all messages from all subscriptions
    for (const subscription of this.subscriptions) {
      subscription.getUpdates(this.subscriptionsBuffer)

      if (this.subscriptionsBuffer.currentWriteOffset()) {
        const binary = this.subscriptionsBuffer.toBinary()
        // send the messages from the subscriptions to the scenes
        outMessages.push(binary)
        // auto process the messages from the subscriptions
        this.incomingMessages.push({ buffer: new ReadWriteByteBuffer(binary), allowedEntityRange: subscription.range })
        // reset the buffer
        this.subscriptionsBuffer.incrementWriteOffset(-this.subscriptionsBuffer.currentWriteOffset())
        this.subscriptionsBuffer.incrementReadOffset(-this.subscriptionsBuffer.currentReadOffset())
      }
    }

    if (this.outgoingMessagesBuffer.currentWriteOffset()) {
      outMessages.push(this.outgoingMessagesBuffer.toBinary())
      this.outgoingMessagesBuffer.incrementWriteOffset(-this.outgoingMessagesBuffer.currentWriteOffset())
      this.outgoingMessagesBuffer.incrementReadOffset(-this.outgoingMessagesBuffer.currentReadOffset())
    }

    // finally resolve the future so the function "receiveBatch" is unblocked
    // and the next scripting frame is allowed to happen
    this.nextFrameFutures.forEach((fut) => fut.resolve({ data: outMessages }))
    // finally clean the futures
    this.nextFrameFutures.length = 0

    // increment the tick number, as per ADR-148
    this.currentTick++
    this.finishedProcessingIncomingMessagesOfTick = false
  }

  dispose() {
    for (const [entityId] of this.entities) {
      this.removeEntity(entityId)
    }
    for (const s of this.subscriptions) {
      s.dispose()
    }
    this.subscriptions.length = 0

    // Dispose avatar system if it exists
    if (this._avatarSystem) {
      this._avatarSystem.dispose()
      this._avatarSystem = undefined
    }

    this.stopped.resolve()

    this.assetManager.dispose()
    this.rootNode.parent = null
    this.rootNode.dispose(false)
  }

  // this method exists to be a wrapper of the function. so it can be mocked for tests without wizzardy
  updateStaticEntities() {
    updateStaticEntities(this)
  }

  // impl RuntimeApi {
  async readFile(file: string): Promise<{ content: Uint8Array, hash: string }> {
    return this.assetManager.readFile(file)
  }
  // }


  // returns a future that will be resolved when the next frame is processed
  async nextTick() {
    const fut = future<CrdtSendToResponse>()
    this.nextFrameFutures.push(fut)
    return fut
  }

  private async _crdtSendToRenderer(data: Uint8Array) {
    if (data.byteLength) {
      this.incomingMessages.push({ buffer: new ReadWriteByteBuffer(data), allowedEntityRange: SCENE_ENTITY_RANGE })
    }

    // create a future to wait until all the messages are processed. even if there
    // are no updates, we must return the future for CRDT updates like the camera
    // position
    return this.nextTick()
  }

  // impl EngineApiInterface {
  async crdtGetState(): Promise<CrdtGetStateResponse> {
    const result = await this._crdtSendToRenderer(new Uint8Array(0))
    const hasEntities = this.mainCrdt.byteLength > 0

    if (hasEntities) {
      // prepend the main.crdt to the response (if not empty). crdt messages are
      // processed sequentially, so the main.crdt will be processed first.
      // if the renderer has any modifications to the main.crdt, they will be
      // applied because they will be processed after
      result.data.unshift(this.mainCrdt)
    }

    return { hasEntities, data: result.data }
  }

  async crdtSendToRenderer(payload: CrdtSendToRendererRequest): Promise<CrdtSendToResponse> {
    return this._crdtSendToRenderer(payload.data)
  }

  get transport(): CommsTransportWrapper | undefined {
    return this._transport
  }

  private incomingNetworkMessages: Uint8Array[] = []
  
  getNetworkMessages(): Uint8Array[] {
    const messages = [...this.incomingNetworkMessages]
    this.incomingNetworkMessages.length = 0
    return messages
  }
  
  attachLivekitTransport(transport: CommsTransportWrapper) {
    this._transport = transport
    
    // Create avatar communication system for this scene
    this._avatarSystem = createAvatarCommunicationSystem(transport)
    
    // Add the avatar system subscription to this scene's subscriptions
    this.subscriptions.push(this._avatarSystem.createSubscription())
    
    transport.events.on('sceneMessageBus', (event) => {
      if (event.data.sceneId === this.entityId) {
        if (event.data.data.byteLength) {
          const [_, data] = decodeMessage(event.data.data)
          const senderBytes = new TextEncoder().encode(event.address)
          const messageLength = senderBytes.byteLength + data.byteLength + 1
          const serializedMessage = new Uint8Array(messageLength)
          serializedMessage.set(new Uint8Array([senderBytes.byteLength]), 0)
          serializedMessage.set(senderBytes, 1)
          serializedMessage.set(data, senderBytes.byteLength + 1)
          this.incomingNetworkMessages.push(serializedMessage)
        }
      }
    })
  }
}

/**
 * MsgType utils to diff between old string messages, and new uint8Array messages.
 */
export enum MsgType {
  String = 1,
  Uint8Array = 2
}

function decodeMessage(value: Uint8Array): [MsgType, Uint8Array] {
  const msgType = value.at(0) as MsgType
  const data = value.subarray(1)
  return [msgType, data]
}

export function encodeMessage(data: Uint8Array, type: MsgType) {
  const message = new Uint8Array(data.byteLength + 1)
  message.set([type])
  message.set(data, 1)
  return message
}