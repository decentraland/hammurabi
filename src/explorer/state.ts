// This file should hold the "state" of the application

import { SceneContext } from "../lib/babylon/scene/scene-context";
import { ExplorerIdentity } from "../lib/decentraland/identity/types";
import { Atom } from "../lib/misc/atom";

export const userIdentity = Atom<ExplorerIdentity>()

export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()

export function setCurrentIdentity(indentity: ExplorerIdentity) {
  userIdentity.swap(indentity)

  console.log(`🔑 Logged in`, indentity)
}

