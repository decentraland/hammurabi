import { AssetContainer, Texture } from '@babylonjs/core'
import '@babylonjs/loaders'
import { Wearable } from '@dcl/schemas'
import { getWearableRepresentation } from '../representation'
import { AssetManager } from '../../scene/AssetManager'

export type Asset = {
  container: AssetContainer
  wearable: Wearable
}

export async function loadMask(
  assetManager: AssetManager,
  bodyShape: string
): Promise<Texture | null> {
  const representation = getWearableRepresentation(assetManager.wearableEntity.metadata, bodyShape)
  const file = representation.contents.find((file) => file.toLowerCase().endsWith('_mask.png'))
  if (file) {
    assetManager.loadTexture(file)
  }
  return null
}

export async function loadTexture(
  assetManager: AssetManager,
  bodyShape: string
): Promise<Texture | null> {
  const representation = getWearableRepresentation(assetManager.wearableEntity.metadata, bodyShape)
  const file = representation.contents.find(
    (file) => file.toLowerCase().endsWith('.png') && !file.toLowerCase().endsWith('_mask.png')
  )
  if (file) {
    return assetManager.loadTexture(file)
  }
  return null
}
