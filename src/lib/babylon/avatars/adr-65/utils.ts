import { WearableCategory } from '@dcl/schemas'
import { getWearableRepresentationOrDefault, isTexture } from './representation'
import { AssetManager } from '../../scene/AssetManager'
import { WearableWithContainer } from './types'

export function isCategoryLoaderDelegate(category: WearableCategory) {
  return (assetManager: AssetManager) => assetManager.wearableEntity.metadata.data.category === category
}

export function isCategoryHidden(category: WearableCategory) {
  return (asset: WearableWithContainer) => {
    return (
      asset.wearable.data.category === category ||
      (asset.wearable.data.hides || []).includes(category) ||
      (asset.wearable.data.replaces || []).includes(category)
    )
  }
}

export function isWearableModelLoader(loader: AssetManager): boolean {
  if (loader.loadableScene.entity.type !== 'wearable') {
    return false
  }
  const representation = getWearableRepresentationOrDefault(loader.wearableEntity.metadata)
  return !isTexture(representation)
}

export function isWearableFacialFeatureLoader(loader: AssetManager): boolean {
  return loader.loadableScene.entity.type === 'wearable' && !isWearableModelLoader(loader)
}
