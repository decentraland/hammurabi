import { Scene, Vector3 } from "@babylonjs/core";
import { SceneContext } from "./scene-context";

// SceneTickSystem adds hooks to the babylon engine to start processing the updates from the workers
export function createSceneTickSystem(scene: Scene, getScenes: () => Iterable<SceneContext>, quotaMs: number) {
  return {
    // this function runs the initial part of the tick defined in ADR-148,
    // before sending GPU commands
    update() {
      const scenes = getScenes()
      const cameraPosition = scene.activeCamera?.position || Vector3.Zero()
      const scenesWithDistance = Array.from(scenes).map(scene => ({ scene, distance: scene.distanceToPoint(cameraPosition) }))
      const sortedScenes = scenesWithDistance.sort((a, b) => a.distance - b.distance)

      const start = performance.now()
      const hasQuota = () => (performance.now() - start) < quotaMs

      for (const { scene } of sortedScenes) {
        // if the processing quota has been exceeded for this frame we will skip it for now.
        if (!scene.update(hasQuota)) return
      }
    },
    // this function runs the final part of the tick defined in ADR-148. 
    // ideally in parallel with GPU commands or while we wait for their completion
    lateUpdate() {
      for (const scene of getScenes()) {
        scene.lateUpdate()
      }
    }
  }
}