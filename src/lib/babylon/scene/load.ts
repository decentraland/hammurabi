import * as BABYLON from '@babylonjs/core'
import { LoadableScene } from '../../decentraland/scene/content-server-entity'
import { SceneContext } from "./context"
import { connectSceneContextUsingQuickJs } from './quickjs-runtime'


/**
 * Loads a remote scene. The baseUrl will be prepended to every request to resolve
 * the scene assets as per https://docs.decentraland.org/contributor/content/filesystem/
 */
export async function loadSceneContext(engineScene: BABYLON.Scene, entityId: string, baseUrl: string) {
  const loadableScene = await getLoadableSceneFromUrl(entityId, baseUrl)
  const ctx = new SceneContext(engineScene, loadableScene)

  connectSceneContextUsingQuickJs(ctx, loadableScene, () => ctx.stopped.isPending).catch((err) => {
    console.error(err)
    debugger
  })
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
