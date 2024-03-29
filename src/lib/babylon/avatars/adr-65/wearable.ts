import { BodyShape, WearableCategory, Wearable } from '@dcl/schemas'

export function getWearableByCategory(wearables: Wearable[], category: WearableCategory) {
  return wearables.find((wearable) => wearable.data.category === category) || null
}

export function getFacialFeatureCategories() {
  return [WearableCategory.EYEBROWS, WearableCategory.MOUTH, WearableCategory.EYES]
}

export function getNonFacialFeatureCategories() {
  return [WearableCategory.HAIR, WearableCategory.UPPER_BODY, WearableCategory.LOWER_BODY, WearableCategory.FEET]
}

export function getDefaultCategories() {
  return [
    WearableCategory.EYEBROWS,
    WearableCategory.MOUTH,
    WearableCategory.EYES,
    WearableCategory.HAIR,
    WearableCategory.UPPER_BODY,
    WearableCategory.LOWER_BODY,
    WearableCategory.FEET,
  ]
}

export function getDefaultWearableUrn(category: WearableCategory, shape: string) {
  switch (category.toLowerCase()) {
    case WearableCategory.EYEBROWS:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:eyebrows_00'
        : 'urn:decentraland:off-chain:base-avatars:f_eyebrows_00'
    case WearableCategory.MOUTH:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:mouth_00'
        : 'urn:decentraland:off-chain:base-avatars:f_mouth_00'
    case WearableCategory.EYES:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:eyes_00'
        : 'urn:decentraland:off-chain:base-avatars:f_eyes_00'
    case WearableCategory.HAIR:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:casual_hair_01'
        : 'urn:decentraland:off-chain:base-avatars:standard_hair'
    case WearableCategory.UPPER_BODY:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:green_hoodie'
        : 'urn:decentraland:off-chain:base-avatars:f_sweater'
    case WearableCategory.LOWER_BODY:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:brown_pants'
        : 'urn:decentraland:off-chain:base-avatars:f_jeans'
    case WearableCategory.FEET:
      return shape === BodyShape.MALE.toLowerCase()
        ? 'urn:decentraland:off-chain:base-avatars:sneakers'
        : 'urn:decentraland:off-chain:base-avatars:bun_shoes'
    default:
      throw new Error(`There is no default wearable for category="${category}"`)
  }
}
