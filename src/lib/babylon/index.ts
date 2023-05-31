import * as BABYLON from '@babylonjs/core'
import { setupEnvironment } from './visual/ambientLights'
import { initKeyboard } from './input'
import { addGlowLayer } from './visual/glowLayer'
import { PLAYER_HEIGHT } from './scene/logic/static-entities'
import { addCrosshair } from './visual/reticle'
import { pickPointerEventsMesh } from './scene/logic/pointer-events'
import { AddButton, guiPanel } from './visual/ui'
import '../misc/audio-debugger'
import { engineInfoComponent } from '../decentraland/sdk-components/engine-info'

export function isChrome() {
  return window.navigator.userAgent.includes('Chrome')
}

export async function initEngine(canvas: HTMLCanvasElement) {
  const parentElement = document.getElementById('voice-chat-audio') as HTMLAudioElement

  const audioContext = new AudioContext()
  const audioDestination = audioContext.createMediaStreamDestination()
  const destinationStream = isChrome() ? await startLoopback(audioDestination.stream) : audioDestination.stream
  parentElement.srcObject = destinationStream

  await parentElement.play()

  const createWebGpu = document.location.search.includes('WEBGPU') && (await BABYLON.WebGPUEngine.IsSupportedAsync)

  const babylon = createWebGpu ?
    new BABYLON.WebGPUEngine(canvas, {
      audioEngine: true,
      powerPreference: 'high-performance',
      deterministicLockstep: true,
      lockstepMaxSteps: 4,
      antialias: false,
      stencil: true,
      audioEngineOptions: {
        audioContext,
        audioDestination
      }
    })
    : new BABYLON.Engine(canvas, true, {
      audioEngine: true,
      autoEnableWebVR: true,
      powerPreference: 'high-performance',
      xrCompatible: true,
      deterministicLockstep: true,
      lockstepMaxSteps: 4,
      antialias: false,
      stencil: true,
      audioEngineOptions: {
        audioContext,
        audioDestination
      }
    })

  if (createWebGpu){
    console.info('CREATING WebGPU ENGINE!!!!!!!!!!')
    await (babylon as BABYLON.WebGPUEngine).initAsync();
  }

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
  scene.blockMaterialDirtyMechanism = true
  scene.autoClear = false // Color buffer
  scene.autoClearDepthAndStencil = false // Depth and stencil, obviously
  // scene.gravity = new BABYLON.Vector3(0, playerConfigurations.gravity, 0)
  // scene.enablePhysics(scene.gravity, new BABYLON.OimoJSPlugin(2))
  scene.getBoundingBoxRenderer().showBackLines = true

  scene.audioEnabled = true
  scene.headphone = true

  if (document.location.search.includes('AUDIO_DEBUG')) {
    const myAnalyser = new BABYLON.Analyser(scene);
    BABYLON.Engine.audioEngine!.connectToAnalyser(myAnalyser);
    myAnalyser.drawDebugCanvas();
  }

  // setup visual parts and environment
  addGlowLayer(scene)
  const { setCamera } = await setupEnvironment(scene)

  scene.gravity.set(0, -0.2, 0)

  // init the cameras
  const firstPersonCamera = new BABYLON.FreeCamera('1st person camera', new BABYLON.Vector3(5, PLAYER_HEIGHT, 5), scene)
  firstPersonCamera.checkCollisions = true;
  firstPersonCamera.applyGravity = true
  firstPersonCamera.inertia = 0.6
  firstPersonCamera.speed = 0.7
  firstPersonCamera.fov = Math.PI / 2
  firstPersonCamera.angularSensibility = 1000
  firstPersonCamera.ellipsoid = new BABYLON.Vector3(0.3, PLAYER_HEIGHT / 2, 0.3);
  firstPersonCamera.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);
  firstPersonCamera.minZ = 0.1 // near plane

  const thirdPersonCamera = new BABYLON.ArcRotateCamera('3rd person camera', -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene)

  setCamera(firstPersonCamera)

  addCrosshair(scene, firstPersonCamera)

  // init our rendering systems
  initKeyboard(scene, firstPersonCamera)

  // Register a render loop to repeatedly render the scene
  babylon.runRenderLoop(function () {
    scene.render()
  })

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
  Object.assign(globalThis, { scene, thirdPersonCamera, firstPersonCamera, setCamera })

  return { scene, thirdPersonCamera, firstPersonCamera, setCamera, audioContext: BABYLON.Engine.audioEngine!.audioContext! }
}



const offerOptions = {
  offerVideo: false,
  offerAudio: true,
  offerToReceiveAudio: false,
  offerToReceiveVideo: false
}

export async function startLoopback(stream: MediaStream) {
  const loopbackStream = new MediaStream()
  const rtcConnection = new RTCPeerConnection()
  const rtcLoopbackConnection = new RTCPeerConnection()

  rtcConnection.onicecandidate = (e) =>
    e.candidate && rtcLoopbackConnection.addIceCandidate(new RTCIceCandidate(e.candidate))

  rtcLoopbackConnection.onicecandidate = (e) =>
    e.candidate && rtcConnection.addIceCandidate(new RTCIceCandidate(e.candidate))

  rtcLoopbackConnection.ontrack = (e) => e.streams[0].getTracks().forEach((track) => loopbackStream.addTrack(track))

  // setup the loopback
  stream.getTracks().forEach((track) => rtcConnection.addTrack(track, stream))

  const offer = await rtcConnection.createOffer(offerOptions)
  await rtcConnection.setLocalDescription(offer)

  await rtcLoopbackConnection.setRemoteDescription(offer)
  const answer = await rtcLoopbackConnection.createAnswer()
  await rtcLoopbackConnection.setLocalDescription(answer)

  await rtcConnection.setRemoteDescription(answer)

  return loopbackStream
}
