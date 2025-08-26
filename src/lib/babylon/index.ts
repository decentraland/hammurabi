import * as BABYLON from '@babylonjs/core'
import '@babylonjs/loaders/glTF/2.0/glTFLoader'
import { setupEnvironment } from './visual/ambientLights'
import { addGlowLayer } from './visual/glowLayer'
import { pickPointerEventsMesh } from './scene/logic/pointer-events'
import { AddButton, guiPanel } from './visual/ui'

export async function initEngine(canvas?: HTMLCanvasElement) {
  let babylon: BABYLON.Engine | BABYLON.WebGPUEngine | BABYLON.NullEngine

    // Node.js environment - use NullEngine for headless operation
    babylon = new BABYLON.NullEngine()

  babylon.disableManifestCheck = true
  babylon.enableOfflineSupport = true

  /**
   * This is the main scene of the engine.
   */
  const scene = new BABYLON.Scene(babylon)
  scene.clearColor = BABYLON.Color3.FromInts(31, 29, 35).toColor4(1)
  scene.collisionsEnabled = true
  scene.autoClear = false // Color buffer
  scene.autoClearDepthAndStencil = false // Depth and stencil
  scene.setRenderingAutoClearDepthStencil(0, false)
  scene.setRenderingAutoClearDepthStencil(1, true, true, false)
  scene.fogEnd = 256
  scene.fogStart = 128
  scene.fogEnabled = true
  scene.actionManager = new BABYLON.ActionManager(scene)
  scene.blockMaterialDirtyMechanism = true
  scene.autoClear = false // Color buffer
  scene.autoClearDepthAndStencil = false // Depth and stencil, obviously
  scene.getBoundingBoxRenderer().showBackLines = true

  // setup visual parts and environment
  addGlowLayer(scene)
  await setupEnvironment(scene)

  scene.gravity.set(0, -0.2, 0)

  // Register a render loop but don't start it immediately
  // The render loop will be started later after cameras are set up
  function renderLoop() {
    if (scene.activeCamera) {
      scene.render()
    }
  }
  babylon.runRenderLoop(renderLoop)

  scene.onBeforeRenderObservable.add(() => {
    pickPointerEventsMesh(scene)
    scene.cleanCachedTextureBuffer();
  })

  if (typeof OffscreenCanvas !== 'undefined') {
    const button = AddButton("Open inspector", guiPanel(scene))
    button.onPointerClickObservable.add(async () => {
      button.isEnabled = false
      await scene.debugLayer.show({ showExplorer: true })
    })
  }

  // this is for debugging purposes
  Object.assign(globalThis, { scene })

  return { scene }
}



