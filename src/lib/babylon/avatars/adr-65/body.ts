import { WearableCategory } from '@dcl/schemas'
import { isCategoryHidden } from './utils'
import { InstantiatedEntries } from '@babylonjs/core'
import { WearableWithContainer } from './types'

export function getBodyShapeAndHideBodyParts(loadedWearables: WearableWithContainer[], bodyShapeInstancedMeshes: InstantiatedEntries) {
  const bodyShape = loadedWearables.find((part) => part.wearable.data.category === WearableCategory.BODY_SHAPE)
  if (!bodyShape) {
    return null
  }

  // hide base body parts if necessary
  const hasSkin = loadedWearables.some((part) => part.wearable.data.category === WearableCategory.SKIN)
  const hideUpperBody = hasSkin || loadedWearables.some(isCategoryHidden(WearableCategory.UPPER_BODY))
  const hideLowerBody = hasSkin || loadedWearables.some(isCategoryHidden(WearableCategory.LOWER_BODY))
  const hideFeet = hasSkin || loadedWearables.some(isCategoryHidden(WearableCategory.FEET))
  const hideHead = hasSkin || loadedWearables.some(isCategoryHidden(WearableCategory.HEAD))

  for (const mesh of bodyShapeInstancedMeshes.rootNodes.flatMap($ => $.getChildMeshes())) {
    const name = mesh.name.toLowerCase()
    if (name.endsWith('ubody_basemesh') && hideUpperBody) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('lbody_basemesh') && hideLowerBody) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('feet_basemesh') && hideFeet) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('head') && hideHead) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('head_basemesh') && hideHead) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('mask_eyes') && hideHead) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('mask_eyebrows') && hideHead) {
      mesh.setEnabled(false)
    }
    if (name.endsWith('mask_mouth') && hideHead) {
      mesh.setEnabled(false)
    }
  }

  return bodyShape
}
