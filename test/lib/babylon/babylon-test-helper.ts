import * as BABYLON from '@babylonjs/core'
import { existsSync, read, readFileSync, writeFileSync } from 'fs'
import { SceneContext } from '../../../src/lib/babylon/scene/scene-context'
import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { ComponentDeclaration } from '../../../src/lib/decentraland/crdt-internal/components'
import { DeleteComponent, DeleteEntity, PutComponentOperation, readAllMessages } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { prettyPrintCrdtMessage } from '../../../src/lib/decentraland/crdt-wire-protocol/prettyPrint'
import { createSceneTickSystem } from '../../../src/lib/babylon/scene/update-scheduler'
import { LoadableScene } from '../../../src/lib/decentraland/scene/content-server-entity'
import { addSystems } from '../../../src/lib/decentraland/system'
import { Entity } from '../../../src/lib/decentraland/types'
import { coerceMaybeU8Array } from '../../../src/lib/quick-js/convert-handles'

export type SceneTestEnvironment = {
  engine: BABYLON.NullEngine
  scene: BABYLON.Scene
  camera: BABYLON.FreeCamera
  ctx: SceneContext
  loadableScene: LoadableScene
  logMessage: (message: string) => void
  startEngine: () => void
}

/**
 * This function creates a test suite with a babylon engine and a scene context.
 */
export function testWithEngine(
  testName: string,
  params: Readonly<LoadableScene> & {
    enableStaticEntities?: boolean
    snapshotFile?: string
    sourceFile?: string
  },
  fn: (args: SceneTestEnvironment) => void
) {
  describe(testName, () => {
    let engine: BABYLON.NullEngine
    let scene: BABYLON.Scene
    let ctx: SceneContext
    let camera: BABYLON.FreeCamera

    let engineStarted = false

    const messages: string[] = [
      `# ${testName}`
    ]

    messages.push(
      '```mermaid',
      'sequenceDiagram',
      '  participant runtime',
      '  participant scene',
      '  participant renderer',
      '  participant babylon',
    )

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

      ctx = new SceneContext(scene, params, false, '')
      ctx.log = message => messages.push(`  # SceneContext.log(${message})`)

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
        messages.push('  end')
        messages.push(`  scene->>renderer: crdtSendToRenderer()`)
        messages.push(`  activate renderer`)
        addMessages(coerceMaybeU8Array(param.data), '    scene-->>renderer: ')

        const { data } = await SceneContext.prototype.crdtSendToRenderer.call(this, param)
        data.forEach((_: Uint8Array) => addMessages(_, '    renderer-->>scene: '))
        messages.push(`  deactivate renderer`)

        return { data }
      })

      jest.spyOn(ctx, 'getElapsedTime').mockImplementation(function () {
        return 1
      })

      jest.spyOn(ctx, 'crdtGetState').mockImplementation(async function () {
        messages.push(`  activate renderer`)
        messages.push(`  scene-->>renderer: crdtGetState()`)
        const { data, hasEntities } = await SceneContext.prototype.crdtGetState.call(this)
        data.forEach(_ => addMessages(_, '    renderer-->>scene: '))
        messages.push(`  deactivate renderer`)
        return { data, hasEntities }
      })

      jest.spyOn(ctx, 'update').mockImplementation(function (hasQuota) {
        messages.push(`    babylon-->>renderer: update()`)
        return SceneContext.prototype.update.call(this, hasQuota)
      })

      jest.spyOn(ctx, 'lateUpdate').mockImplementation(function () {
        messages.push(`    babylon-->>renderer: lateUpdate()`)
        return SceneContext.prototype.lateUpdate.call(this)
      })
    })

    afterAll(() => {
      scene.dispose()
      engine.dispose()
    })

    fn({
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
      get camera() {
        if (!camera) throw new Error('You can only access the ctx inside a test')
        return camera
      },
      loadableScene: params,
      logMessage(message) {
        messages.push(message)
      },
      startEngine() {
        if (!engineStarted) {
          engineStarted = true
          const tickSystem = createSceneTickSystem(scene, () => [ctx], 1000000)
          addSystems(scene, tickSystem)
          engine.onBeginFrameObservable.add(() => messages.push((`  activate babylon`)))
          engine.onEndFrameObservable.add(() => messages.push((`  deactivate babylon`)))
          engine.runRenderLoop(() => {
            scene.render(false)
          })
        }
      }
    })

    if (params.snapshotFile) {
      it('checks the snapshot', () => {
        messages.push('```')

        if (params.sourceFile) {
          messages.push('\nThe file that produced this snapshot was:')
          messages.push('```typescript')
          messages.push(readFileSync(params.sourceFile, 'utf-8'))
          messages.push('```')
        }

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
  mustEqual(given: Uint8Array) {
    const expected = this.finish()

    const prettyGiven = Array.from(readAllMessages(new ReadWriteByteBuffer(given))).map(_ => prettyPrintCrdtMessage(_))
    const prettyExpected = Array.from(readAllMessages(new ReadWriteByteBuffer(expected))).map(_ => prettyPrintCrdtMessage(_))
    expect(prettyGiven).toEqual(prettyExpected)
    expect(given).toEqual(expected)
  }
  #buffer = new ReadWriteByteBuffer()

  put<T>(transformComponent: ComponentDeclaration<T, number>, entityId: Entity, timestamp: number, value: T) {
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

  delete(transformComponent: ComponentDeclaration<any, number>, entityId: Entity, timestamp: number) {
    DeleteComponent.write({ entityId, componentId: transformComponent.componentId, timestamp }, this.#buffer)
    return this
  }

  deleteEntity(entityId: Entity) {
    DeleteEntity.write({ entityId }, this.#buffer)
    return this
  }

  finish() {
    const ret = this.#buffer.toBinary()
    this.#buffer = new ReadWriteByteBuffer()
    return ret
  }
}
