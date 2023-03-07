import * as BABYLON from '@babylonjs/core'
import { SceneContext } from '../../../src/lib/babylon/scene/context'
import { LoadableScene } from '../../../src/lib/decentraland/scene/content-server-entity'

export function initTestEngine(loadableScene: Readonly<LoadableScene>) {
  let engine: BABYLON.NullEngine
  let scene: BABYLON.Scene
  let ctx: SceneContext

  beforeAll(() => {
    engine = new BABYLON.NullEngine({
      renderWidth: 512,
      renderHeight: 256,
      textureSize: 512,
      deterministicLockstep: true,
      lockstepMaxSteps: 4
    });

    scene = new BABYLON.Scene(engine)

    ctx = new SceneContext(scene, loadableScene)

    engine.runRenderLoop(() => {
      process.stderr.write('RENDER FRAME\n')
    })
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
    loadableScene,
  }
}