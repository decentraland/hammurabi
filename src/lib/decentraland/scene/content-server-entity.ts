import { Emote, Scene, Wearable } from "@dcl/schemas";

export type WearableContentServerEntity = {
  type: 'wearable'
  // content files of the entity
  content: Array<{ file: string; hash: string }>
  // entity metadata
  metadata: Wearable
}

export type SceneContentServerEntity = {
  type: 'scene'
  // content files of the entity
  content: Array<{ file: string; hash: string }>
  // entity metadata
  metadata: Scene
}

export type EmoteContentServerEntity = {
  type: 'emote'
  // content files of the entity
  content: Array<{ file: string; hash: string }>
  // entity metadata
  metadata: Emote
}

export type ContentServerEntity =
  | WearableContentServerEntity
  | EmoteContentServerEntity
  | SceneContentServerEntity

export type LoadableScene = Readonly<{
  // baseUrl to download all assets
  baseUrl: string
  // urn of the entity. usually the first pointer
  urn: string
  // entity file fom the content server
  entity: ContentServerEntity
}>

export function resolveFile(entity: Pick<ContentServerEntity, 'content'>, src: string): string | null {
  // filenames are lower cased as per https://adr.decentraland.org/adr/ADR-80
  const normalized = src.toLowerCase()

  // and we iterate over the entity content mappings to resolve the file hash
  for (const { file, hash } of entity.content) {
    if (file.toLowerCase() == normalized) return hash
  }

  return null
}

export function resolveFileAbsolute(scene: LoadableScene, src: string): string | null {
  const resolved = resolveFile(scene.entity, src)

  if (resolved) return scene.baseUrl + resolved

  return null
}
