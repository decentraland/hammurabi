import * as BABYLON from '@babylonjs/core'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { SceneContext } from '../../../src/lib/babylon/scene/context'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { ComponentDeclaration, SerDe } from '../../../src/lib/decentraland/crdt-internal/components'
import { DeleteComponent, PutComponentOperation, readAllMessages } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { prettyPrintCrdtMessage } from '../../../src/lib/decentraland/crdt-wire-protocol/prettyPrint'
import { LoadableScene } from '../../../src/lib/decentraland/scene/content-server-entity'
import { Entity } from '../../../src/lib/decentraland/types'
import { coerceMaybeU8Array } from '../../../src/lib/quick-js/convert-handles'

/**
 * This function creates a test suite with a babylon engine and a scene context.
 */
export function testWithEngine(
  testName: string,
  params: Readonly<LoadableScene> & {
    enableStaticEntities?: boolean
    snapshotFile?: string
  },
  fn: (args: {
    engine: BABYLON.NullEngine
    scene: BABYLON.Scene
    ctx: SceneContext
    loadableScene: LoadableScene
    logMessage: (message: string) => void
  }) => void
) {
  describe(testName, () => {
    let engine: BABYLON.NullEngine
    let scene: BABYLON.Scene
    let ctx: SceneContext
    let camera: BABYLON.Camera

    let engineStarted = false

    const messages: string[] = []

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
      camera = new BABYLON.FreeCamera('camera', BABYLON.Vector3.Zero(), scene)
      scene.activeCamera = camera

      ctx = new SceneContext(scene, params)

      if (!params.enableStaticEntities) {
        jest.spyOn(ctx, 'updateStaticEntities').mockImplementation(() => void 0)
      }

      function addMessages(data: Uint8Array, prefix: string) {
        Array.from(readAllMessages(new ReadWriteByteBuffer(data))).forEach(_ => {
          const component = 'componentId' in _ ? ctx.components[_.componentId] : undefined
          messages.push(prefix + prettyPrintCrdtMessage(_, component?.declaration))
        })
      }

      // the following functions "decorate" the function to instrument their inputs and outputs for snapshot generation
      jest.spyOn(ctx, 'crdtSendToRenderer').mockImplementation(async function (param) {
        messages.push(`  crdtSendToRenderer()`)
        addMessages(coerceMaybeU8Array(param.data), '  scene->renderer: ')
        const { data } = await SceneContext.prototype.crdtSendToRenderer.call(this, param)
        data.forEach(_ => addMessages(_, '  renderer->scene: '))
        return { data }
      })


      jest.spyOn(ctx, 'crdtGetState').mockImplementation(async function () {
        messages.push(`  crdtGetState()`)
        const { data } = await SceneContext.prototype.crdtGetState.call(this)
        data.forEach(_ => addMessages(_, '  renderer->scene: '))
        return { data }
      })

      engine.onBeginFrameObservable.add(() => messages.push(`BEGIN BABYLON_FRAME`))
      engine.onEndFrameObservable.add(() => messages.push(`END BABYLON_FRAME`))
    })

    afterAll(() => {
      scene.dispose()
      engine.dispose()
    })

    function startEngine() {
      if (!engineStarted) {
        engineStarted = true
        engine.runRenderLoop(() => { })
      }
    }

    fn({
      get engine() {
        if (!engine) throw new Error('You can only access the engine inside a test')
        startEngine()
        return engine
      },
      get scene() {
        if (!scene) throw new Error('You can only access the scene inside a test')
        startEngine()
        return scene
      },
      get ctx() {
        if (!ctx) throw new Error('You can only access the ctx inside a test')
        startEngine()
        return ctx
      },
      loadableScene: params,
      logMessage(message) {
        messages.push(message)
      }
    })

    if (params.snapshotFile) {
      it('checks the snapshot', () => {
        const snapshotFileContents = existsSync(params.snapshotFile) ? readFileSync(params.snapshotFile, 'utf-8') : ''
        const currentContents = messages.join('\n')

        if (!snapshotFileContents || process.env.UPDATE_SNAPSHOTS) {
          writeFileSync(params.snapshotFile, currentContents)
        }

        expect(currentContents).toEqual(snapshotFileContents)
      })
    }
  })
}

export class CrdtBuilder {
  #buffer = new ReadWriteByteBuffer()

  put<T>(transformComponent: ComponentDeclaration<T>, entityId: Entity, timestamp: number, value: T) {
    const componentBuffer = new ReadWriteByteBuffer()
    transformComponent.serialize(value, componentBuffer)
    PutComponentOperation.write({
      componentId: transformComponent.componentId,
      entityId,
      timestamp,
      data: componentBuffer.toBinary()
    }, this.#buffer)
    return this
  }

  delete(transformComponent: ComponentDeclaration<any>, entityId: Entity, timestamp: number) {
    DeleteComponent.write({ entityId, componentId: transformComponent.componentId, timestamp }, this.#buffer)
    return this
  }

  finish() {
    const ret = this.#buffer.toBinary()
    this.#buffer = new ReadWriteByteBuffer()
    return ret
  }
}