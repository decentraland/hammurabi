import { AbstractMesh, Color3, InstantiatedEntries, Orientation, PBRMaterial, Scene, StandardMaterial, Texture } from '@babylonjs/core'
import { WearableCategory } from '@dcl/schemas'
import { isCategoryLoaderDelegate } from './utils'
import { AvatarShapeWithAssetManagers } from './types'
import { AssetManager } from '../../scene/AssetManager'
import { loadMask, loadTexture } from './loader'

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

export async function applyFacialFeaturesToMeshes(
  scene: Scene,
  instance: InstantiatedEntries,
  eyes: [Texture | null, Texture | null],
  eyebrows: [Texture | null, Texture | null],
  mouth: [Texture | null, Texture | null],
  config: AvatarShapeWithAssetManagers
) {
  for (const mesh of instance.rootNodes.flatMap($ => $.getChildMeshes())) {
    if (mesh.name.toLowerCase().endsWith('mask_eyes')) {
      const [baseTexture, maskTexture] = eyes
      if (baseTexture) {
        applyTextureAndMask(scene, 'eyes', mesh, baseTexture, config.eyeColor || Color3.Black(), maskTexture, Color3.White())
      } else {
        mesh.setEnabled(false)
      }
    }
    if (mesh.name.toLowerCase().endsWith('mask_eyebrows')) {
      const [baseTexture, maskTexture] = eyebrows
      if (baseTexture) {
        applyTextureAndMask(scene, 'eyebrows', mesh, baseTexture, config.hairColor || Color3.Black(), maskTexture, config.hairColor || Color3.Black())
      } else {
        mesh.setEnabled(false)
      }
    }
    if (mesh.name.toLowerCase().endsWith('mask_mouth')) {
      const [baseTexture, maskTexture] = mouth
      if (baseTexture) {
        applyTextureAndMask(scene, 'mouth', mesh, baseTexture, config.skinColor || Color3.Black(), maskTexture, config.skinColor || Color3.Black())
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
  color: Record<'r' | 'g' | 'b', number>,
  mask: Texture | null,
  maskColor: Record<'r' | 'g' | 'b', number>
) {
  const newMaterial = new StandardMaterial(`${name}_standard_material`, scene)

  newMaterial.atomicMaterialsUpdate(newMaterial => {
    newMaterial.alphaMode = PBRMaterial.PBRMATERIAL_ALPHABLEND
    newMaterial.backFaceCulling = true
    newMaterial.specularColor = Color3.Black()
    texture.hasAlpha = true
    newMaterial.sideOrientation = Orientation.CW
    newMaterial.diffuseTexture = texture

    if (mask) {
      newMaterial.emissiveTexture = mask
      newMaterial.diffuseColor = new Color3(maskColor.r, maskColor.g, maskColor.b)
    } else {
      newMaterial.diffuseColor = new Color3(color.r, color.g, color.b)
    }
  })

  mesh.material = newMaterial
}

export function applySkinMaterialsToInstances(instances: InstantiatedEntries, loadableAvatar: AvatarShapeWithAssetManagers) {
  const materials = instances.rootNodes.flatMap($ => $.getChildMeshes().map($ => $.material))

  // apply colors to all PBR materials of this instanced meshes
  for (const material of materials) {
    if (material instanceof PBRMaterial) {
      material.unfreeze()
      material.atomicMaterialsUpdate(material => {
        // remove metallic effect
        material.specularIntensity = 0
        if (material.metallic) {
          material.metallic = 0
          material.metallicF0Factor = 0
        }

        if (material.name.toLowerCase().includes('hair')) {
          material.roughness = 1
          material.albedoColor = new Color3(
            loadableAvatar.hairColor?.r ?? 0,
            loadableAvatar.hairColor?.g ?? 0,
            loadableAvatar.hairColor?.b ?? 0,
          )
          material.specularIntensity = 0
          material.alpha = 1
        }

        if (material.name.toLowerCase().includes('skin')) {
          material.albedoColor = new Color3(
            loadableAvatar.skinColor?.r ?? 0,
            loadableAvatar.skinColor?.g ?? 0,
            loadableAvatar.skinColor?.b ?? 0,
          )
          material.specularIntensity = 0
          material.alpha = 1
        }
      })

      material.freeze()
    }
  }
}
