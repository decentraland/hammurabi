import { BodyShape, Wearable, } from '@dcl/schemas'
import { hasWearableRepresentation } from './representation'
import { LoadableAvatarConfig } from './babylon/types'
import { PBAvatarShape } from '@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen'
import { fetchAssetManagers } from './avatar-asset-manager'
import { Scene } from '@babylonjs/core'
import { getDefaultCategories, getDefaultWearableUrn, getWearableByCategory } from './wearable'

export async function createLoadableAvatarConfig(avatar: PBAvatarShape, contentServerBaseUrl: string, scene: Scene): Promise<LoadableAvatarConfig> {
  const bodyShape = avatar.bodyShape || BodyShape.FEMALE


  // fill default categories
  const defaultWearableUrns: string[] = []
  const categories = getDefaultCategories()



  // if loading multiple wearables (either from URNs or URLs), or if wearable is emote, render full avatar
  const assetManagers = await fetchAssetManagersForWearablesAndEmotes(
    [...avatar.wearables, ...avatar.emotes, bodyShape],
    bodyShape,
    contentServerBaseUrl,
    scene
  )

  for (const category of categories) {
    const wearable = getWearableByCategory(assetManagers.loadedWearables.map($ => $.wearableEntity.metadata), category)
    if (!wearable) {
      const urn = getDefaultWearableUrn(category, bodyShape)
      if (urn) {
        defaultWearableUrns.push(urn)
      } else {
        throw new Error(`Could not get default URN for category="${category}"`)
      }
    }
  }

  if (defaultWearableUrns.length > 0) {
    // if loading multiple wearables (either from URNs or URLs), or if wearable is emote, render full avatar
    const defaultFeatures = await fetchAssetManagersForWearablesAndEmotes(
      defaultWearableUrns,
      bodyShape,
      contentServerBaseUrl,
      scene
    )

    assetManagers.loadedWearables.push(...defaultFeatures.loadedWearables)
    assetManagers.loadedEmotes.push(...defaultFeatures.loadedEmotes)
  }

  return {
    ...avatar,
    ...assetManagers
  }
}

async function fetchAssetManagersForWearablesAndEmotes(
  urns: string[],
  bodyShapeUrn: string,
  contentServerBaseUrl: string,
  scene: Scene
) {
  // gather wearables from profile, urns, urls and base64s
  const assetManagers = await fetchAssetManagers(urns, contentServerBaseUrl, scene)

  // merge wearables and emotes from all sources
  const loadedWearables = assetManagers
    .filter((assetManager) => assetManager.loadableScene.entity.type === 'wearable')
    .filter((assetManager) => hasWearableRepresentation(assetManager.loadableScene.entity.metadata as Wearable, bodyShapeUrn))

  const loadedEmotes = assetManagers
    .filter((assetManager) => assetManager.loadableScene.entity.type === 'emote')

  return { loadedWearables, loadedEmotes }
}
