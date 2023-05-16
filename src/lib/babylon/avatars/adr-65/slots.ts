import { Emote, Scene, Wearable, WearableCategory } from '@dcl/schemas'
import { hasWearableRepresentation } from './representation'
import { AvatarShapeWithAssetManagers } from './types'
import { AssetManager } from '../../scene/AssetManager'

const categoriesHiddenBySkin = [
  WearableCategory.HELMET,
  WearableCategory.HAIR,
  WearableCategory.FACIAL_HAIR,
  WearableCategory.MOUTH,
  WearableCategory.EYEBROWS,
  WearableCategory.EYES,
  WearableCategory.UPPER_BODY,
  WearableCategory.LOWER_BODY,
  WearableCategory.FEET,
]

// the getVisibleSlots function iterates over the wearables data and returns all
// the slots that are not hidden by other wearables
export function getVisibleSlots(config: AvatarShapeWithAssetManagers) {
  const slots = new Map<WearableCategory, AssetManager>()

  let wearableLoaders: AssetManager[] = [...config.loadedWearables]

  // arrange wearbles in slots
  for (const loader of wearableLoaders) {
    const w = loader.wearableEntity.metadata
    const slot = w.data.category
    if (hasWearableRepresentation(w, config.bodyShape)) {
      slots.set(slot, loader)
    }
  }

  let hasSkin = false
  // grab only the wearables that ended up in the map, and process in reverse order (last wearables can hide/replace the first ones)
  wearableLoaders = wearableLoaders.filter((loader) => slots.get(loader.wearableEntity.metadata.data.category) === loader).reverse()
  const alreadyRemoved = new Set<string>()
  for (const loader of wearableLoaders) {
    const wearable = loader.wearableEntity.metadata
    const category = wearable.data.category
    if (alreadyRemoved.has(category)) {
      continue
    }
    const replaced = wearable.data.replaces || []
    const hidden = wearable.data.hides || []
    const toRemove = Array.from(new Set([...replaced, ...hidden]))
    for (const slot of toRemove) {
      if (slot !== category) {
        slots.delete(slot)
        alreadyRemoved.add(slot)
      }
    }
    if (wearable.data.category === WearableCategory.SKIN) {
      hasSkin = true
    }
  }

  // skins hide all the following slots
  if (hasSkin) {
    for (const category of categoriesHiddenBySkin) {
      slots.delete(category)
    }
  }

  return slots
}
