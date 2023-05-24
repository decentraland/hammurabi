// This file should hold the "state" of the application

import future, { IFuture } from "fp-future";
import { SceneContext } from "../lib/babylon/scene/scene-context";
import { ExplorerIdentity } from "../lib/decentraland/identity/types";
import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen";
import { loadSceneContext, unloadScene } from "../lib/babylon/scene/load";
import { Scene } from "@babylonjs/core";

export const userEntity: IFuture<ExplorerIdentity> = future()
export let currentRealm: AboutResponse | null = null
export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()

export async function setCurrentRealm(realm: AboutResponse, scene: Scene) {
  currentRealm = realm

  // destroy all scenes, copy the loadedScenesByEntityId into an array to avoid
  // errors caused by mutations of the loadedScenesByEntityId
  for (const entityId of Array.from(loadedScenesByEntityId.keys())) {
    unloadScene(entityId)
  }

  // now that all scenes are destroyed, load the new realm
  if (realm.configurations?.scenesUrn) {
    for (const urn of realm.configurations?.scenesUrn) {
      await loadSceneContext(scene, urn)

      // teleport the camera to the first scene
      if (loadedScenesByEntityId.size == 1) {
        const [first] = loadedScenesByEntityId
        scene.activeCamera!.position.copyFrom(first[1].rootNode.position)
        scene.activeCamera!.position.y = 2
      }
    }
  }
}

export function setCurrentIdentity(indentity: ExplorerIdentity) {
  userEntity.resolve(indentity)

  console.log(`🔑 Logged in`, indentity)
}