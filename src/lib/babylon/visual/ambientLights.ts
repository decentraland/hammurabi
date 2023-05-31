import * as BABYLON from '@babylonjs/core'
import { SkyMaterial, GridMaterial } from '@babylonjs/materials'
import { floorMeshes } from '../scene/logic/colliders'

const PARCEL_SIZE = 16

export async function setupEnvironment(scene: BABYLON.Scene) {
  const groundColor = new BABYLON.Color3(0.1, 0.1, 0.1)
  const sunColor = new BABYLON.Color3(1, 1, 1)

  const reflectionProbe = new BABYLON.ReflectionProbe('skyReflection', 512, scene, true, true)
  const skyMaterial = new SkyMaterial("sky material", scene)
  skyMaterial.luminance = 1;
  skyMaterial.turbidity = 5;
  skyMaterial.useSunPosition = true;
  skyMaterial.sunPosition.set(-1, 0.81, -0.75).scaleInPlace(5000000)
  const hemiLight = new BABYLON.HemisphericLight('default light', skyMaterial.sunPosition, scene)
  const envHelper = new BABYLON.EnvironmentHelper({ groundShadowLevel: 0.6, createGround: true, groundSize: 1024 }, scene)

  const gridGroundMaterial = new GridMaterial("grid", scene);
  gridGroundMaterial.gridRatio = 1;
  gridGroundMaterial.majorUnitFrequency = 16
  gridGroundMaterial.mainColor.set(0.1, 0.1, 0.1).scaleInPlace(6)
  gridGroundMaterial.lineColor.set(0, 0, 0)

  // prevent z-fighting with ground planes
  gridGroundMaterial.disableDepthWrite = true

  envHelper.skybox?.setEnabled(false)

  const skybox = BABYLON.MeshBuilder.CreateSphere(
    'skybox',
    { diameter: 2 * 500 - 5, sideOrientation: BABYLON.Mesh.BACKSIDE },
    scene
  )

  reflectionProbe.cubeTexture.gammaSpace = false

  reflectionProbe.cubeTexture.dispose = () => {
    throw new Error('cannot dispose sky reflections')
  }

  reflectionProbe.renderList!.push(skybox)
  reflectionProbe.attachToMesh(skybox)
  reflectionProbe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME

  gridGroundMaterial.fogEnabled = true
  envHelper.ground!.material = gridGroundMaterial
  envHelper.ground!.applyFog = true
  envHelper.ground!.checkCollisions = true

  if (document.location.protocol === 'https:') {
    // here we add XR support
    await scene.createDefaultXRExperienceAsync({ floorMeshes })
  }

  floorMeshes.push(envHelper.ground!);

  skybox.material = skyMaterial

  hemiLight.diffuse = BABYLON.Color3.White()
  hemiLight.groundColor = groundColor.clone()
  hemiLight.specular = sunColor.clone()

  function setCamera(camera: BABYLON.Camera) {
    scene.activeCamera?.detachControl()
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true)
    scene.activeCamera = camera
  }

  scene.onBeforeRenderObservable.add(repositionCamera)

  function repositionCamera() {
    // set the ground at 0 always and round position towards PARCEL_SIZE
    envHelper.ground!.position.set(
      Math.floor(scene.activeCamera!.globalPosition.x / PARCEL_SIZE) * PARCEL_SIZE - scene.activeCamera!.globalPosition.x,
      -scene.activeCamera!.globalPosition.y,
      Math.floor(scene.activeCamera!.globalPosition.z / PARCEL_SIZE) * PARCEL_SIZE - scene.activeCamera!.globalPosition.z
    )

    // make the skybox follow the camera target
    skybox.position.set(scene.activeCamera!.globalPosition.x, scene.activeCamera!.globalPosition.y, scene.activeCamera!.globalPosition.z)
    envHelper.rootMesh.position.set(scene.activeCamera!.globalPosition.x, scene.activeCamera!.globalPosition.y, scene.activeCamera!.globalPosition.z)

    // make the sun position relative to the horizon
    skyMaterial.cameraOffset.y = scene.activeCamera!.globalPosition.y;

    const sunfade = 1.0 - Math.min(Math.max(1.0 - Math.exp(skyMaterial.sunPosition.y / 10), 0.0), 0.9)

    hemiLight.intensity = sunfade
    hemiLight.diffuse.set(sunfade, sunfade, sunfade)
    hemiLight.groundColor.copyFrom(groundColor).scale(sunfade)
    hemiLight.specular.copyFrom(sunColor).scale(sunfade)
  }

  // add some variables to the global context to debug using the browser's inspector
  Object.assign(globalThis, { gridGroundMaterial, skyMaterial, hemiLight, skybox, envHelper })

  return {
    setCamera,
    repositionCamera,
    reflectionProbe
  }
}

