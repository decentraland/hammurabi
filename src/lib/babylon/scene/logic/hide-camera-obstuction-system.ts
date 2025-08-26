import { AbstractMesh, ArcRotateCamera, Mesh, Ray, Scene, Vector3, int } from "@babylonjs/core";
import { getColliderLayers } from "./colliders";
import { ColliderLayer } from "@dcl/protocol/out-js/decentraland/sdk/components/mesh_collider.gen";

// This system hides the meshes between the camera and the player on the third person camera
// it also "elastically" moves the camera to move it out from objects
export function createCameraObstructionSystem(scene: Scene, camera: ArcRotateCamera) {
  const ray: Ray = new Ray(Vector3.Zero(), Vector3.One(), 1)
  const rayDir: Vector3 = Vector3.Zero()
  // camera seems to get stuck into things
  // should move camera away from things by a value of cameraSkin
  const cameraSkin: number = 0.5
  let prevPickedMeshes: AbstractMesh[] = []
  let pickedMeshes: AbstractMesh[] = []
  const makeObstructionInvisible = false
  const elasticSteps = 50

  /**
   * The following method handles the use case wherein some mesh
   * comes between the avatar and the camera thus obstructing the view
   * of the avatar.
   * Two ways this can be handled
   * a) make the obstructing  mesh invisible
   *   instead of invisible a better option would have been to make semi transparent.
   *   Unfortunately, unlike mesh, mesh instances do not "visibility" setting)
   *   Every alternate frame make mesh visible and invisible to give the impression of semi-transparent.
   * b) move the camera in front of the obstructing mesh
   */
  function handleObstruction() {
    //get vector from av (camera.target) to camera
    camera.position.subtractToRef(camera.target, rayDir)
    //start ray from av to camera
    ray.origin = camera.target
    ray.length = rayDir.length()
    ray.direction = rayDir.normalize()

    // handle case were pick is with a child of avatar, avatar atatchment. etc
    const pickedObjects = scene.multiPickWithRay(ray, (mesh) => {
      if (getColliderLayers(mesh) & ColliderLayer.CL_PHYSICS) return true
      return false
    })

    if (makeObstructionInvisible) {
      prevPickedMeshes = pickedMeshes
      if (pickedObjects && pickedObjects.length > 0) {
        pickedMeshes = []
        for (let pi of pickedObjects) {
          if (pi.pickedMesh?.isVisible || (pi.pickedMesh && prevPickedMeshes.includes(pi.pickedMesh))) {
            pi.pickedMesh.isVisible = false
            pickedMeshes.push(pi.pickedMesh)
          }
        }
        for (let pm of prevPickedMeshes) {
          if (!pickedMeshes.includes(pm)) {
            pm.isVisible = true
          }
        }
      } else {
        for (let pm of prevPickedMeshes) {
          pm.isVisible = true
        }
        prevPickedMeshes.length = 0
      }
    }

    if (pickedObjects) {
      if (pickedObjects.length > 0) {
        // postion the camera in front of the mesh that is obstructing camera

        // if only one obstruction and it is invisible then if it is not collidable or our camera is not collidable then do nothing
        if (
          pickedObjects.length == 1 &&
          !isSeeAble(pickedObjects[0]!.pickedMesh) &&
          (!pickedObjects[0].pickedMesh?.checkCollisions || !camera.checkCollisions)
        )
          return

        // if our camera is collidable then we donot want it to get stuck behind another collidable obsrtucting mesh
        let pickedPoint: Vector3 | null = null

        // we will asume the order of picked meshes is from closest to avatar to furthest
        // we should get the first one which is visible or invisible and collidable
        for (let i = 0; i < pickedObjects.length; i++) {
          let pm = pickedObjects[i].pickedMesh
          if (isSeeAble(pm)) {
            pickedPoint = pickedObjects[i].pickedPoint
            break
          } else if (pm?.checkCollisions) {
            pickedPoint = pickedObjects[i].pickedPoint
            break
          }
        }
        if (pickedPoint == null) return

        const c2p: Vector3 = camera.position.subtract(pickedPoint)
        // note that when camera is collidable, changing the orbital camera radius may not work.
        // changing the radius moves the camera forward (with collision?) and collision can interfere with movement
        //
        // in every cylce we are dividing the distance to tarvel by same number of steps.
        // as we get closer to destination the speed will thus slow down.
        // when just 1 unit distance left, lets snap to the final position.
        // when calculating final position make sure the camera does not get stuck at the pickposition especially
        // if collision is on

        const l: number = c2p.length()
        if (camera.checkCollisions) {
          let step: Vector3
          if (l <= 1) {
            step = c2p.addInPlace(c2p.normalizeToNew().scaleInPlace(cameraSkin))
          } else {
            step = c2p.normalize().scaleInPlace(l / elasticSteps)
          }
          camera.position = camera.position.subtract(step)
        } else {
          let step: number
          if (l <= 1) step = l + cameraSkin
          else step = l / elasticSteps
          camera.radius = camera.radius - step
        }
      }
    }
  }


  // how many ways can a mesh be invisible?
  function isSeeAble(mesh?: AbstractMesh | null): boolean {
    if (!mesh) return false
    if (!mesh.isVisible) return false
    if (!mesh.isEnabled) return false
    if (mesh.visibility == 0) return false
    if (mesh.material != null && mesh.material.alphaMode != 0 && mesh.material.alpha == 0) return false
    return true
  }


  return {
    update() {
      if (camera.radius > camera.lowerRadiusLimit!) {
        handleObstruction()
      }
    }
  }
}