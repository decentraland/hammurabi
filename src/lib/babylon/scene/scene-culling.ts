import { Scene } from "@babylonjs/core"
import { SceneContext } from "./scene-context"

// the sceneCullingSystem rapidly checks whether the bounding box of the scene are
// colliding with the frustum of the camera to enable/disable their root entity
export function createSceneCullingSystem(babylonScene: Scene, getScenes: () => Iterable<SceneContext>) {
  return {
    update() {
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
    }
  }
}

