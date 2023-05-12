import { AssetManager } from "../scene/AssetManager";
import { getLoadableSceneFromPointers } from "../scene/load";
import { LoadableScene } from "../../decentraland/scene/content-server-entity";
import { Scene } from "@babylonjs/core";

const assetManagers = new Map<string, AssetManager>()

export function getAssetManager(loadableScene: LoadableScene, scene: Scene): AssetManager {
  const current = assetManagers.get(loadableScene.urn)
  if (current) {
    return current
  }
  const newAssetManager = new AssetManager(loadableScene, scene)
  assetManagers.set(loadableScene.urn, newAssetManager)
  return newAssetManager
}

/**
 * Fetches the entities represented by the given urns and processes them into Wearable and Emote definitions.
 * @param pointers List of urns for wearables or emotes
 * @param peerUrl The url of a Catalyst
 * @returns List of wearables and list of emotes for given urns
 */
export async function fetchAssetManagers(pointers: string[], peerUrl: string, scene: Scene): Promise<AssetManager[]> {
  if (pointers.length === 0) {
    return []
  }
  const entities = await getLoadableSceneFromPointers(pointers, peerUrl)
  return entities.map((entity) => getAssetManager(entity, scene))
}
