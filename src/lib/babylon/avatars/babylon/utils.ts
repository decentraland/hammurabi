import { WearableCategory, Wearable } from '@dcl/schemas'
import { getWearableRepresentationOrDefault, isTexture } from '../representation'
import { Asset } from './scene'
import { AssetManager } from '../../scene/AssetManager'
import { isWearable } from '../wearable'

export function isCategoryLoaderDelegate(category: WearableCategory) {
  return (assetManager: AssetManager) => assetManager.wearableEntity.metadata.data.category === category
}

export function isHidden(category: WearableCategory) {
  return (asset: Asset) => {
    return (
      asset.wearable.data.category === category ||
      (asset.wearable.data.hides || []).includes(category) ||
      (asset.wearable.data.replaces || []).includes(category)
    )
  }
}

export function isSuccesful(result: any): result is Asset {
  return !!result
}

export function isModelLoader(loader: AssetManager): boolean {
  if (!isWearable(loader.loadableScene.entity.metadata as Wearable)) {
    return false
  }
  const representation = getWearableRepresentationOrDefault(loader.wearableEntity.metadata)
  return !isTexture(representation)
}

export function isFacialFeatureLoader(loader: AssetManager): boolean {
  return !isModelLoader(loader)
}
