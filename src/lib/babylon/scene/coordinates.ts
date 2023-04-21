import { Vector3 } from "@babylonjs/core";
import { SceneContext } from "./scene-context";

// This function converts a "global" coordinate to a "scene" coordinate system
export function globalCoordinatesToSceneCoordinates(scene: SceneContext, coordinates: Vector3) {
  // the coordinate transformation COULD use the inverse world matrix of the root entity,
  // but since scenes only _translate_ in space and do not rotate or scale, we can
  // simplify the math to positionVec3 - rootNodePositionVec3
  return coordinates.subtract(scene.rootNode.position)
}

// This function converts a "scene" coordinate to a "global" coordinate system
export function sceneCoordinatesToBabylonGlobalCoordinates(scene: SceneContext, coordinates: Vector3) {
  return coordinates.add(scene.rootNode.position)
}