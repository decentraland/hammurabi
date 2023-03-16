import * as BABYLON from '@babylonjs/core'
import { SceneContext } from '../../../src/lib/babylon/scene/context'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { SerDe } from '../../../src/lib/decentraland/crdt-internal/components'
import { DeleteComponent, PutComponentOperation } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { LoadableScene } from '../../../src/lib/decentraland/scene/content-server-entity'
import { Entity } from '../../../src/lib/decentraland/types'

export function initTestEngine(params: Readonly<LoadableScene> & {
  enableStaticEntities?: boolean
}) {
  let engine: BABYLON.NullEngine
  let scene: BABYLON.Scene
  let ctx: SceneContext

  beforeAll(() => {
    BABYLON.Logger.LogLevels = BABYLON.Logger.WarningLogLevel | BABYLON.Logger.ErrorLogLevel

    engine = new BABYLON.NullEngine({
      renderWidth: 512,
      renderHeight: 256,
      textureSize: 512,
      deterministicLockstep: true,
      lockstepMaxSteps: 4,
    });

    scene = new BABYLON.Scene(engine)

    ctx = new SceneContext(scene, params)

    if (!params.enableStaticEntities) {
      jest.spyOn(ctx, 'updateStaticEntities').mockImplementation(() => void 0)
    }

    engine.runRenderLoop(() => void 0)
  })

  afterAll(() => {
    scene.dispose()
    engine.dispose()
  })

  return {
    get engine() {
      if (!engine) throw new Error('You can only access the engine inside a test')
      return engine
    },
    get scene() {
      if (!scene) throw new Error('You can only access the scene inside a test')
      return scene
    },
    get ctx() {
      if (!ctx) throw new Error('You can only access the ctx inside a test')
      return ctx
    },
    loadableScene: params,
  }
}

export class CrdtBuilder {
  #buffer = new ReadWriteByteBuffer()

  put<T>(componentId: number, entityId: Entity, timestamp: number, serde: SerDe<T>, value: T) {
    const componentBuffer = new ReadWriteByteBuffer()
    serde.serialize(value, componentBuffer)
    PutComponentOperation.write(entityId, componentId, timestamp,  componentBuffer.toBinary(), this.#buffer)
    return this
  }

  delete(componentId: number, entityId: Entity, timestamp: number) {
    DeleteComponent.write(entityId, componentId, timestamp, this.#buffer)
    return this
  }

  toBinary() {
    const ret = this.#buffer.toBinary()
    this.#buffer = new ReadWriteByteBuffer()
    return ret
  }
}