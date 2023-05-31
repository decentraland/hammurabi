import { Texture } from '@babylonjs/core'
import { Wearable } from '@dcl/schemas'
import { getEmoteRepresentation, getWearableRepresentation, isTexture } from './representation'
import { EmoteWithContainer, WearableWithContainer } from './types'
import { AssetManager } from '../../scene/AssetManager'
import { EmoteADR74 } from '@dcl/schemas/dist/platform/item/emote/emote'

// load an emote from the asset container
export async function loadEmoteForBodyShape(assetManager: AssetManager, bodyShape: string): Promise<EmoteWithContainer> {
  const emote = assetManager.loadableScene.entity.metadata as EmoteADR74
  const representation = getEmoteRepresentation(emote, bodyShape)
  const container = await assetManager.getContainerFuture(representation.mainFile)

  // Stop any animations of the loaded container.
  for (const animationGroup of container.animationGroups) {
    animationGroup.stop()
  }

  return { container, emote }
}

export async function loadWearableForBodyShape(assetManager: AssetManager, bodyShape: string): Promise<WearableWithContainer | void> {
  const wearable = assetManager.loadableScene.entity.metadata as Wearable
  const representation = getWearableRepresentation(wearable, bodyShape)
  if (isTexture(representation)) {
    return
  }

  const container = await assetManager.getContainerFuture(representation.mainFile)

  // Stop any animations
  for (const animationGroup of container.animationGroups) {
    animationGroup.stop()
    animationGroup.reset()
    // dispose the embedded animations in every wearable, those won't be needed
    animationGroup.dispose()
  }

  return { container, wearable }
}

// loaads the first PNG filename that does NOT end with _mask.png
export async function loadMask(assetManager: AssetManager, bodyShape: string): Promise<Texture | null> {
  const representation = getWearableRepresentation(assetManager.wearableEntity.metadata, bodyShape)
  const file = representation.contents.find((file) => file.toLowerCase().endsWith('_mask.png'))
  if (file) {
    assetManager.loadTexture(file)
  }
  return null
}

// loaads the first PNG file with its filename ending with _mask.png
export async function loadTexture(assetManager: AssetManager, bodyShape: string): Promise<Texture | null> {
  const representation = getWearableRepresentation(assetManager.wearableEntity.metadata, bodyShape)
  const file = representation.contents.find(
    (file) => file.toLowerCase().endsWith('.png') && !file.toLowerCase().endsWith('_mask.png')
  )
  if (file) {
    return assetManager.loadTexture(file)
  }
  return null
}
