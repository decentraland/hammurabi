import * as BABYLON from '@babylonjs/core'
import { parseEntityUrn } from '../../decentraland/identifiers'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'
import { SceneContext } from "./scene-context"
import { connectSceneContextUsingWebWorkerQuickJs } from './webworker-runtime'

export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()

/**
 * Loads a remote scene. The baseUrl will be prepended to every request to resolve
 * the scene assets as per https://docs.decentraland.org/contributor/content/filesystem/
 */
export async function loadSceneContext(engineScene: BABYLON.Scene, urn: string) {
  const parsed = parseEntityUrn(urn)

  if (!parsed.baseUrl) throw new Error('Only URNs with baseUrl are supported at this time.')

  // cancel early if the scene is already loaded
  if (loadedScenesByEntityId.has(parsed.entityId)) return

  const loadableScene = await getLoadableSceneFromUrl(parsed.entityId, parsed.baseUrl)

  const ctx = new SceneContext(engineScene, loadableScene)

  await ctx.initAsyncJobs()

  connectSceneContextUsingWebWorkerQuickJs(ctx, loadableScene)

  loadedScenesByEntityId.set(parsed.entityId, ctx)
}

/**
 * Unloads the scene from memory. It should also trigger all the operations to
 * release all the resources, including the runtime of the scene.
 * @param {string} entityId - The entity ID of the entity holding the scene.
 */
export function unloadScene(entityId: string) {
  const scene = loadedScenesByEntityId.get(entityId)
  if (scene) {
    scene.dispose()
    loadedScenesByEntityId.delete(entityId)
  }
}

export async function getLoadableSceneFromUrl(entityId: string, baseUrl: string): Promise<LoadableScene> {
  const result = await fetch(new URL(entityId, baseUrl).toString())
  const entity = await result.json()

  return {
    id: entityId,
    entity,
    baseUrl,
  }
}
