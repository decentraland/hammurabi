import { BodyShape, EmoteDefinition, Wearable, WearableRepresentation } from '@dcl/schemas'
import { EmoteADR74 } from '@dcl/schemas/dist/platform/item/emote/emote'

export function is(representation: WearableRepresentation, bodyShape: BodyShape) {
  return representation.bodyShapes.map($ => $.toLowerCase()).includes(bodyShape.toLowerCase())
}

export function isMale(representation: WearableRepresentation) {
  return is(representation, BodyShape.MALE)
}

export function isFemale(representation: WearableRepresentation) {
  return is(representation, BodyShape.FEMALE)
}

export function getEmoteRepresentation(emote: EmoteADR74, bodyShape: string = BodyShape.FEMALE) {
  const representation = emote.emoteDataADR74.representations.find((representation) =>
    representation.bodyShapes.map($ => $.toLowerCase()).includes(bodyShape.toLowerCase() as any)
  )
  if (!representation) {
    throw new Error(`Could not find a representation of bodyShape=${bodyShape} for emote="${emote.id}"`)
  }
  return representation
}

export function getWearableRepresentation(wearable: Wearable, bodyShape: string = BodyShape.FEMALE) {
  switch (bodyShape.toLowerCase()) {
    case BodyShape.FEMALE.toLowerCase(): {
      const female = wearable.data.representations.find(isFemale)
      if (!female) {
        throw new Error(`Could not find a BaseFemale representation for wearable="${wearable.id}"`)
      }
      return female
    }
    case BodyShape.MALE.toLowerCase(): {
      const male = wearable.data.representations.find(isMale)!
      if (!male) {
        throw new Error(`Could not find a BaseMale representation for wearable="${wearable.id}"`)
      }
      return male
    }
  }
  throw new Error('invalid body shape')
}

export function getWearableRepresentationOrDefault(definition: Wearable, shape = BodyShape.FEMALE) {
  if (hasWearableRepresentation(definition, shape)) {
    return getWearableRepresentation(definition, shape)
  }
  if (definition.data.representations.length > 0) {
    return definition.data.representations[0]
  }
  throw new Error(`The wearable="${definition.id}" has no representation`)
}

export function hasWearableRepresentation(definition: Wearable, shape: string = BodyShape.FEMALE) {
  try {
    getWearableRepresentation(definition, shape)
    return true
  } catch (error) {
    return false
  }
}

export function getContentUrl(representation: WearableRepresentation) {
  const content = representation.contents.find((content) => content === representation.mainFile)
  if (!content) {
    throw new Error(`Could not find main file`)
  }
  return content
}

export function isTexture(representation: WearableRepresentation) {
  return representation.mainFile.endsWith('png')
}
