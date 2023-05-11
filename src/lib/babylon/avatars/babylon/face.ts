import { AbstractMesh, Color3, Orientation, PBRMaterial, Scene, StandardMaterial, Texture } from '@babylonjs/core'
import { WearableCategory, Wearable } from '@dcl/schemas'
import { Asset, loadMask, loadTexture } from './scene'
import { isCategoryLoaderDelegate } from './utils'
import { LoadableAvatarConfig } from './types'
import { AssetManager } from '../../scene/AssetManager'

function getCategoryLoader(assetManagers: AssetManager[], bodyShape: string) {
  return async (category: WearableCategory): Promise<[Texture | null, Texture | null]> => {
    const feature = assetManagers.find(isCategoryLoaderDelegate(category))
    if (feature) {
      return Promise.all([
        loadTexture(feature, bodyShape),
        loadMask(feature, bodyShape)
      ])
    }
    return [null, null] as [null, null]
  }
}

export async function getFacialFeatures(assetManagers: AssetManager[], bodyShape: string) {
  const loadCategory = getCategoryLoader(assetManagers, bodyShape)
  const [eyes, eyebrows, mouth] = await Promise.all([
    loadCategory(WearableCategory.EYES),
    loadCategory(WearableCategory.EYEBROWS),
    loadCategory(WearableCategory.MOUTH),
  ])
  return { eyes, eyebrows, mouth }
}

export async function applyFacialFeatures(
  scene: Scene,
  bodyShape: Asset,
  eyes: [Texture | null, Texture | null],
  eyebrows: [Texture | null, Texture | null],
  mouth: [Texture | null, Texture | null],
  config: LoadableAvatarConfig
) {
  for (const mesh of bodyShape.container.meshes) {
    if (mesh.name.toLowerCase().endsWith('mask_eyes')) {
      const [texture, mask] = eyes
      if (texture) {
        applyTextureAndMask(scene, 'eyes', mesh, texture, config.eyeColor || Color3.Black(), mask, Color3.White())
      } else {
        mesh.setEnabled(false)
      }
    }
    if (mesh.name.toLowerCase().endsWith('mask_eyebrows')) {
      const [texture, mask] = eyebrows
      if (texture) {
        applyTextureAndMask(scene, 'eyebrows', mesh, texture, config.hairColor || Color3.Black(), mask, config.hairColor || Color3.Black())
      } else {
        mesh.setEnabled(false)
      }
    }
    if (mesh.name.toLowerCase().endsWith('mask_mouth')) {
      const [texture, mask] = mouth
      if (texture) {
        applyTextureAndMask(scene, 'mouth', mesh, texture, config.skinColor || Color3.Black(), mask, config.skinColor || Color3.Black())
      } else {
        mesh.setEnabled(false)
      }
    }
  }
}

function applyTextureAndMask(
  scene: Scene,
  name: string,
  mesh: AbstractMesh,
  texture: Texture,
  color: Record<'r' | 'g' | 'b', number> | Color3,
  mask: Texture | null,
  maskColor: Record<'r' | 'g' | 'b', number> | Color3
) {
  const newMaterial = new StandardMaterial(`${name}_standard_material`, scene)
  newMaterial.alphaMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
  newMaterial.backFaceCulling = true
  newMaterial.specularColor = Color3.Black()
  texture.hasAlpha = true
  newMaterial.sideOrientation = Orientation.CW
  newMaterial.diffuseTexture = texture
  newMaterial.diffuseColor = mask ? Color3.Black() : new Color3(maskColor.r, maskColor.g, maskColor.b)
  if (mask) {
    newMaterial.emissiveTexture = mask
    newMaterial.diffuseColor =  new Color3(color.r, color.g, color.b)
  }
  mesh.material = newMaterial
}
