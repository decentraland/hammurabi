import { SceneContext } from "../scene-context"
import { BabylonEntity } from "../BabylonEntity"

/**
 * This function perform the scheduled parenting operations (scene.unparentedEntities)
 * and prevents cycles in the final hierarchy.
 * 
 * If a cycle is found, then the parenting operation will remain pending until
 * scene.hierarchyChanged is set to true again by a mutated TransformComponent.
 * 
 * This function also executes iteratively while scene.hierarchyChanged==true.
 */
export function resolveCyclicParening(scene: SceneContext) {
  while (scene.hierarchyChanged) {
    scene.hierarchyChanged = false

    // Iterate over the unparentedEntities and try to re-parent them if there are no cycles
    // > set hierarchyChanged=true in case of successful reparenting
    for (const entityId of scene.unparentedEntities) {
      const entity = scene.getEntityOrNull(entityId)
      // pending reparentings may be outdated due to entity deletion messages
      if (entity) {
        const parentEntityId = entity.expectedParentEntityId

        // cancel if the entity self references itself
        if (parentEntityId === entity.entityId) { continue }

        // cancel if the parent entity was deleted
        if (scene.deletedEntities.has(parentEntityId)) {
          // TODO add tests for reparenting with deleted entities
          entity.parent = scene.rootNode
          scene.hierarchyChanged = true
          scene.unparentedEntities.delete(entityId)
          continue
        }

        // get or create the entity that should be the parent as defined per TransformComponent
        const desiredParent = scene.getOrCreateEntity(parentEntityId)

        // walk up the parents of the desiredParent to find the current entity, that would be a cycle
        const needsCorrection = entity.parent !== desiredParent
        const hasCycle = needsCorrection && detectEntityIdInParentChain(desiredParent, entity)

        if (!hasCycle) {
          entity.parent = desiredParent
          scene.hierarchyChanged = true
          // remove from the unparented list
          scene.unparentedEntities.delete(entityId)
        } else {
          entity.parent = scene.rootNode
        }
      }
    }
  }
}

/**
 * This function walks the parents of the provided searchEntity
 * @returns true if the searchEntity is present in the parenting chain
 */
function detectEntityIdInParentChain(leafEntity: BabylonEntity, searchEntity: BabylonEntity) {
  // walk the parents until we find the searchEntity we are looking for
  let parent: BabylonEntity | null = leafEntity
  while (parent = parent?.parent as any) {
    if (parent === searchEntity) return true
  }
  return false
}