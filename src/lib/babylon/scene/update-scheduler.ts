import { Scene, Vector3 } from "@babylonjs/core";
import { SceneContext } from "./context";

// this function runs the initial part of the tick defined in ADR-148,
// before sending GPU commands
export function runTickUpdate(scenes: Iterable<SceneContext>, cameraPosition: Vector3, quotaMs: number) {
  const scenesWithDistance = Array.from(scenes).map(scene => ({ scene, distance: scene.distanceToPoint(cameraPosition) }))
  const sortedScenes = scenesWithDistance.sort((a, b) => a.distance - b.distance)

  const start = performance.now()
  const hasQuota = () => (performance.now() - start) < quotaMs

  for (const { scene } of sortedScenes) {
    // if the processing quota has been exceeded for this frame we will skip it for now.
    if (!scene.update(hasQuota)) return
  }
}

// this function runs the final part of the tick defined in ADR-148. 
// ideally in parallel with GPU commands or while we wait for their completion
export function runTickLateUpdate(scenes: Iterable<SceneContext>) {
  for (const scene of scenes) {
    scene.lateUpdate()
  }
}

// the initSceneCulling function rapidly checks whether the bounding box of the scene are
// colliding with the frustum of the camera to enable/disable their root entity
export function initSceneCulling(babylonScene: Scene, getScenes: () => Iterable<SceneContext>) {
  babylonScene.onBeforeAnimationsObservable.add((babylonScene) => {
    const planes = babylonScene.frustumPlanes
    if (planes) {
      for (const scene of getScenes()) {
        // we know the static bounding box of the scene in advance. we can disable the
        // whole tree for rendering if it is not in the frustum.
        if (scene.boundingBox) {
          scene.rootNode.setEnabled(scene.boundingBox.isInFrustum(planes))
        }
      }
    }
  })
}

// initScheduler adds hooks to the babylon engine to start processing the updates from the workers
export function initScheduler(scene: Scene, getScenes: () => Iterable<SceneContext>, quotaMs: number) {
  scene.onBeforeAnimationsObservable.add(() => {
    runTickUpdate(getScenes(), scene.activeCamera!.position, quotaMs)
  })
  scene.onAfterDrawPhaseObservable.add(() => {
    runTickLateUpdate(getScenes())
  })
}