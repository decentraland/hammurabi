import { Color3, PBRMaterial, Scene } from '@babylonjs/core'
import { Wearable } from '@dcl/schemas'
import { getWearableRepresentation, isTexture } from '../representation'
import { LoadableAvatarConfig } from './types'
import { Asset } from './scene'
import { AssetManager } from '../../scene/AssetManager'

export async function loadWearable(
  assetManager: AssetManager,
  loadableAvatar: LoadableAvatarConfig
): Promise<Asset> {
  const wearable = assetManager.loadableScene.entity.metadata as Wearable
  const representation = getWearableRepresentation(wearable, loadableAvatar.bodyShape)
  if (isTexture(representation)) {
    throw new Error(`The wearable="${wearable.id}" is a texture`)
  }
  const container = await assetManager.getContainerFuture(representation.mainFile)

  // Clean up
  for (const material of container.materials) {
    if (material instanceof PBRMaterial) {
      material.unfreeze()

      // remove metallic effect
      material.specularIntensity = 0
      if (material.metallic) {
        material.metallic = 0
        material.metallicF0Factor = 0
      }

      if (material.name.toLowerCase().includes('hair')) {
          material.albedoColor = new Color3(
            loadableAvatar.hairColor?.r ?? 0,
            loadableAvatar.hairColor?.g ?? 0,
            loadableAvatar.hairColor?.b ?? 0,
          ).toLinearSpace()
          material.specularIntensity = 0
          material.alpha = 1
      }

      if (material.name.toLowerCase().includes('skin')) {
        material.albedoColor = new Color3(
          loadableAvatar.skinColor?.r ?? 0,
          loadableAvatar.skinColor?.g ?? 0,
          loadableAvatar.skinColor?.b ?? 0,
        ).toLinearSpace()
        material.specularIntensity = 0
        material.alpha = 1
      }

      material.freeze()
    }
  }

  // Stop any animations
  for (const animationGroup of container.animationGroups) {
    animationGroup.stop()
    animationGroup.reset()
    animationGroup.dispose()
  }

  return { container, wearable }
}

