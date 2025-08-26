import { BodyShape, EmoteCategory, Locale, Rarity, Wearable, } from '@dcl/schemas'
import { hasWearableRepresentation } from './adr-65/representation'
import { AvatarShapeWithAssetManagers } from './adr-65/types'
import { PBAvatarShape } from '@dcl/protocol/out-js/decentraland/sdk/components/avatar_shape.gen'
import { fetchAssetManagers, getAssetManager } from './avatar-asset-manager'
import { Scene } from '@babylonjs/core'
import { getDefaultCategories, getDefaultWearableUrn, getWearableByCategory } from './adr-65/wearable'
import { AssetManager } from '../scene/AssetManager'

export async function createLoadableAvatarConfig(
  avatar: PBAvatarShape,
  contentServerBaseUrl: string, // each avatar can live in a different content server
  scene: Scene
): Promise<AvatarShapeWithAssetManagers> {
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

  // then look for missing categories
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

  // if there are missing categories, load them
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

  loadedEmotes.push(...await baseEmotesLoaders(scene))

  return { loadedWearables, loadedEmotes }
}

async function baseEmotesLoaders(scene: Scene) {
  return [
    'clap',
    'walk',
    'run',
    'jump',
    'dab',
    'dance',
    'fist-pump',
    'head-explode',
    'idle',
    'love',
    'money',
  ].map(_ => createBaseEmoteAssetManager(_, scene))
}

// create a on-the-fly representation of the base (hardcoded) emotes
function createBaseEmoteAssetManager(emote: string, scene: Scene): AssetManager {
  const glb = `${emote}.glb`
  return getAssetManager({
    urn: emote,
    baseUrl: `TODO:casla/emotes/`,
    entity: {
      content: [{ file: glb, hash: glb }],
      type: 'emote',
      metadata: {
        id: emote,
        name: emote,
        description: emote,
        collectionAddress: "0x123",
        rarity: Rarity.COMMON,
        i18n: [
          {
            code: Locale.EN,
            text: emote
          }
        ],
        emoteDataADR74: {
          category: EmoteCategory.MISCELLANEOUS,
          representations: [
            {
              bodyShapes: [BodyShape.MALE, BodyShape.FEMALE],
              mainFile: glb,
              contents: [glb]
            }
          ],
          tags: [],
          loop: ['idle', 'money', 'clap', 'run', 'walk', 'jump'].includes(emote as any)
        },
        image: "none",
        thumbnail: "none",
      }
    }
  }, scene)
}