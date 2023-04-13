import * as BABYLON from '@babylonjs/core'
import { setupEnvironment } from './visual/ambientLights'
import { initKeyboard } from './input'
import { addGlowLayer } from './visual/glowLayer'
import { initSceneCulling, initScheduler } from './scene/update-scheduler'
import { loadedScenesByEntityId } from './scene/load'
import { PLAYER_HEIGHT } from './scene/logic/static-entities'

// we only spend ONE millisecond per frame procesing messages from scenes,
// it is a conservative number but we want to prioritize CPU time for rendering
const MS_PER_FRAME_PROCESSING_SCENE_MESSAGES = 1

export function initEngine(canvas: HTMLCanvasElement) {
  BABYLON.Database.IDBStorageEnabled = true

  const babylon = new BABYLON.Engine(canvas, true, {
    audioEngine: true,
    autoEnableWebVR: true,
    deterministicLockstep: true,
    lockstepMaxSteps: 4,
    alpha: false,
    antialias: true,
    stencil: true,
  })
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
  scene.audioEnabled = true
  scene.headphone = true
  scene.fogEnd = 256
  scene.fogStart = 128
  scene.fogEnabled = true
  scene.actionManager = new BABYLON.ActionManager(scene)
  // scene.gravity = new BABYLON.Vector3(0, playerConfigurations.gravity, 0)
  // scene.enablePhysics(scene.gravity, new BABYLON.OimoJSPlugin(2))
  scene.getBoundingBoxRenderer().showBackLines = true

  initScheduler(scene, () => loadedScenesByEntityId.values(), MS_PER_FRAME_PROCESSING_SCENE_MESSAGES)
  initSceneCulling(scene, () => loadedScenesByEntityId.values())


  // setup visual parts and environment
  addGlowLayer(scene)
  const { setCamera } = setupEnvironment(scene)

  // init the cameras
  const firstPersonCamera = new BABYLON.FreeCamera('1st person camera', new BABYLON.Vector3(5, PLAYER_HEIGHT, 5), scene)
  firstPersonCamera.checkCollisions = true;
  firstPersonCamera.applyGravity = true
  firstPersonCamera.inertia = 0.6
  firstPersonCamera.speed = 2
  firstPersonCamera.fov = 1
  firstPersonCamera.angularSensibility = 1000
  const thirdPersonCamera = new BABYLON.ArcRotateCamera('3rd person camera', -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene)

  setCamera(firstPersonCamera)

  // init our rendering systems
  initKeyboard(scene, firstPersonCamera)

  // Register a render loop to repeatedly render the scene
  babylon.runRenderLoop(function () {
    scene.render()
  })

  // Watch for browser/canvas resize events
  window.addEventListener('resize', function () {
    babylon.resize()
  })

  return { scene, thirdPersonCamera, firstPersonCamera, setCamera }
}
