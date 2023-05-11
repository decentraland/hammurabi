import * as BABYLON from '@babylonjs/core'
import { parseEntityUrn } from '../../decentraland/identifiers'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'
import { SceneContext } from "./scene-context"
import { connectSceneContextUsingWebWorkerQuickJs } from './webworker-runtime'
import { loadedScenesByEntityId } from '../../../explorer/state'
import { VirtualScene } from '../../decentraland/virtual-scene'
import { json } from '../../misc/json'
import { Entity } from '@dcl/schemas'

/**
 * Loads a remote scene. The baseUrl will be prepended to every request to resolve
 * the scene assets as per https://docs.decentraland.org/contributor/content/filesystem/
 */
export async function loadSceneContext(engineScene: BABYLON.Scene, urn: string, virtualScene?: VirtualScene) {
  const parsed = parseEntityUrn(urn)

  if (!parsed.baseUrl) throw new Error('Only URNs with baseUrl are supported at this time.')

  // cancel early if the scene is already loaded
  if (loadedScenesByEntityId.has(parsed.entityId)) return

  const loadableScene = await getLoadableSceneFromUrl(parsed.entityId, parsed.baseUrl)

  const ctx = new SceneContext(engineScene, loadableScene)

  if (virtualScene) {
    ctx.subscriptions.push(virtualScene.createSubscription())
  }

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
    urn: entityId,
    entity,
    baseUrl,
  }
}

/**
  * Fetches the entities that represent the given pointers.
  * @param pointers List of pointers
  * @param peerUrl The url of a catalyst
  * @returns List of active entities for given pointers
  */
export async function fetchEntitiesByPointers(pointers: string[], contentServerBaseUrl: string) {
  if (pointers.length === 0) {
    return []
  }
  // TODO: add here support for custom ?baseUrl query param in URN
  const entities = await json<Entity[]>(`${contentServerBaseUrl}/entities/active`, {
    method: 'post',
    body: JSON.stringify({ pointers }),
    headers: { 'Content-Type': 'application/json' },
  })
  return entities
}

export async function getLoadableSceneFromPointers(pointers: string[], contentServerBaseUrl: string): Promise<LoadableScene[]> {
  const entities = await fetchEntitiesByPointers(pointers, contentServerBaseUrl)

  return entities.map($ => ({
    urn: $.pointers[0] || $.id,
    entity: {
      type: $.type as any,
      content: $.content,
      metadata: $.metadata,
    },
    baseUrl: contentServerBaseUrl + '/contents/',
  }))
}
