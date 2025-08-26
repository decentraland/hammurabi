import * as BABYLON from '@babylonjs/core'
import { parseEntityUrn } from '../../decentraland/identifiers'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'
import { SceneContext } from "./scene-context"
import { connectSceneContextUsingNodeJs } from './nodejs-runtime'
import { loadedScenesByEntityId } from '../../decentraland/state'
import { VirtualScene } from '../../decentraland/virtual-scene'
import { json } from '../../misc/json'
import { Entity } from '@dcl/schemas'
import { initHotReload } from './hot-reload'
import { sleep } from '../../misc/promises'
import { Atom } from '../../misc/atom'

/**
 * Creates and initializes a scene context from a loadable scene
 */
async function createSceneContext(engineScene: BABYLON.Scene, loadableScene: LoadableScene, entityId: string, isGlobal: boolean, virtualScene?: VirtualScene): Promise<SceneContext> {
  if ((loadableScene.entity.metadata as any).runtimeVersion !== '7') throw new Error('The scene is not compatible with the current runtime version. It may be using SDK6')

  const ctx = new SceneContext(engineScene, loadableScene, isGlobal, entityId)

  if (virtualScene) {
    ctx.subscriptions.push(virtualScene.createSubscription())
  }

  await ctx.initAsyncJobs()
  
    // Node.js environment - use in-process WebWorker runtime with MemoryTransport
  console.log(`[HEADLESS] Using in-process runtime for scene ${entityId}`)
  connectSceneContextUsingNodeJs(ctx, loadableScene)
  
  loadedScenesByEntityId.set(entityId, ctx)

  return ctx
}

/**
 * Loads a remote scene. The baseUrl will be prepended to every request to resolve
 * the scene assets as per https://docs.decentraland.org/contributor/content/filesystem/
 */
export async function loadSceneContext(engineScene: BABYLON.Scene, options: { urn: string, isGlobal: boolean }, virtualScene?: VirtualScene) {
  const parsed = parseEntityUrn(options.urn)

  if (!parsed.baseUrl) throw new Error('Only URNs with baseUrl are supported at this time.')

  // cancel early if the scene is already loaded
  if (loadedScenesByEntityId.has(parsed.entityId)) return loadedScenesByEntityId.get(parsed.entityId)!

  const loadableScene = await getLoadableSceneFromUrl(parsed.entityId, parsed.baseUrl)

  return await createSceneContext(engineScene, loadableScene, parsed.entityId, options.isGlobal, virtualScene)
}

/**
 * Loads a scene from a local context environment
 */
export async function loadSceneContextFromLocal(sceneContext: Atom<SceneContext>, engineScene: BABYLON.Scene, options: { baseUrl: string, isGlobal: boolean, withoutHotReload?: boolean }, virtualScene?: VirtualScene): Promise<Atom<SceneContext>> {
  const loadableScene = await getLoadableSceneFromLocalContext(options.baseUrl)
  const entityId = loadableScene.urn

  sceneContext.swap(await createSceneContext(engineScene, loadableScene, entityId, options.isGlobal, virtualScene))

  async function reloadScene() {
    unloadScene(entityId)
    await sleep(100)
    options.withoutHotReload = true
    loadSceneContextFromLocal(sceneContext, engineScene, options)
  }

  if (!options.withoutHotReload) {
    // Initialize hot reload for local development
    initHotReload(options.baseUrl, entityId, reloadScene)
  }
  
  return sceneContext
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
  const result = await fetch(`${baseUrl}${entityId}`)
  const entity: any = await result.json()

  return {
    urn: entityId,
    entity,
    baseUrl,
  }
}

/**
 * Fetches scene.json from baseUrl to get the pointers
 * @param baseUrl The base URL of the local context
 * @returns Scene configuration with pointers
 */
export async function fetchSceneJson(baseUrl: string) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
  const result = await fetch(`${normalizedBaseUrl}scene.json`)
  return await result.json()
}

/**
 * Loads scene content from local context environment
 * @param baseUrl The base URL of the local context
 * @returns Object containing scene entities and metadata
 */
export async function getLoadableSceneFromLocalContext(baseUrl: string) {
  // First, fetch scene.json to get the pointers
  const sceneConfig: any = await fetchSceneJson(baseUrl)
  const pointers = sceneConfig.scene?.parcels || []
  if (pointers.length === 0) {
    throw new Error('No pointers found in scene.json')
  }
  // Then post to /content/entities/active with the pointers
  const entitiesResponse = await fetch(`${baseUrl}/content/entities/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers })
  })
  
  const entity = (await entitiesResponse.json() as any)[0]

  return {
    baseUrl: baseUrl + '/content/contents/',
    entity,
    urn: entity.id
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
