import { Scene } from "@babylonjs/core"
import { avatarShapeComponent } from "../decentraland/sdk-components/avatar-shape"
import { BabylonEntity } from "./scene/BabylonEntity"
import { SceneContext } from "./scene/scene-context"
import { AVATAR_ENTITY_RANGE, entityIsInRange } from "./scene/logic/static-entities"
import { EntityUtils } from "../decentraland/crdt-internal/generational-index-pool"
import { Entity } from "../decentraland/types"

/**
 * This system is in charge of deciding which of all AvatarShape components will be rendered the next frame.
 */
export function createAvatarRendererSystem(scene: Scene, getScenes: () => Iterable<SceneContext>) {
  const avatarEntities = new Map<string, AvatarEntityReference>()

  function update() {
    const avatars = new Map<string, Array<BabylonEntity>>()
    const materializedScenes = Array.from(getScenes())

    // look for all avatars from all runnning scenes
    function addAvatar(key: string, avatar: BabylonEntity) {
      const list = avatars.get(key)
      if (list) {
        list.push(avatar)
      } else {
        avatars.set(key, [avatar])
      }
    }

    // iterate over all running scenes and their AvatarShape. get a unique id
    // for each avatar and add them to a list
    for (const scene of materializedScenes) {
      const AvatarShape = scene.components[avatarShapeComponent.componentId]
      for (const [entity] of AvatarShape.iterator()) {
        const avatar = scene.entities.get(entity)
        if (avatar) {
          addAvatar(uniqueAvatarId(scene.id, entity), avatar)
        }
      }
    }

    // =========================================================================
    const finalAvatars = new Map<string, BabylonEntity>()

    // then filter by priority and deduplicate results. we consider a duplicated result
    // any entity that is present in more than one scene and it is within the range of
    // reserved entities for avatars (128 to 512)
    for (const [_id, list] of avatars) {
      // TODO, we render everything for now picking the first one
      const [first, ...rest] = list

      finalAvatars.set(_id, first)
      if (first.appliedComponents.avatarRenderer) {
        first.appliedComponents.avatarRenderer.visible = true
      }

      for (const avatar of rest) {
        if (avatar.appliedComponents.avatarRenderer) {
          avatar.appliedComponents.avatarRenderer.visible = false
        }
      }
    }

    // =========================================================================
    // finally, render the avatars into objects. first removing the entities
    // that don't exist anymore and then adding the new ones

    //   delete old ones
    for (const [id] of avatarEntities) {
      if (!finalAvatars.has(id)) {
        avatarEntities.delete(id)
      }
    }

    //   create new ones
    for (const [id, avatar] of finalAvatars) {
      const existing = avatarEntities.get(id)
      if (!existing) {
        avatarEntities.set(id, new AvatarEntityReference(new WeakRef(avatar)))
      } else {
        existing.parentAvatar = new WeakRef(avatar)
      }
    }
    // =========================================================================
  }

  return {
    update
  }
}

export class AvatarEntityReference {
  constructor(public parentAvatar: WeakRef<BabylonEntity>) { }
}

export function uniqueAvatarId(sceneId: number, entity: Entity) {
  // avatar ids are in the range [128, 512) and are considered unique
  if (entityIsInRange(entity, AVATAR_ENTITY_RANGE)) {
    const [entityNumber] = EntityUtils.fromEntityId(entity)
    return `${entityNumber}`
  }
  // on the contrary, every other entity is considered unique per scene
  return `${sceneId}:${entity}`
}