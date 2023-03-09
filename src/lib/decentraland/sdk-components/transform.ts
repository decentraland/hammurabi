import { Quaternion, Vector3 } from "@babylonjs/core";
import { ComponentType, SerDe } from "../crdt-internal/components";
import { Entity } from "../types";
import type { ComponentOperation } from '.'
import { BabylonEntity } from "../../babylon/scene/entity";

export const TRANSFORM_COMPONENT_ID = 1

export type Transform = {
  position: Vector3
  scale: Vector3
  rotation: Quaternion
  parent: Entity
}

export const transformSerde: SerDe<Transform> = {
  deserialize(buffer) {
    return {
      position: new Vector3(buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32()),
      rotation: new Quaternion(buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32()),
      scale: new Vector3(buffer.readFloat32(), buffer.readFloat32(), buffer.readFloat32()),
      parent: buffer.readUint32()
    }
  },
  serialize(value, buffer) {
    buffer.writeFloat32(value.position.x);
    buffer.writeFloat32(value.position.y);
    buffer.writeFloat32(value.position.z);
    buffer.writeFloat32(value.rotation.x);
    buffer.writeFloat32(value.rotation.y);
    buffer.writeFloat32(value.rotation.z);
    buffer.writeFloat32(value.rotation.w);
    buffer.writeFloat32(value.scale.x);
    buffer.writeFloat32(value.scale.y);
    buffer.writeFloat32(value.scale.z);
    buffer.writeUint32(value.parent || 0);
  },
}

export const putTransformComponent: ComponentOperation = (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = component.getOrNull(entity.entityId) as Transform | null
  const currentValue = entity.ecsComponentValues.transform
  entity.ecsComponentValues.transform = newValue || undefined

  let needsReparenting = false

  const isAddingNewValue = Boolean(!currentValue && newValue)
  const isReplacingValue = Boolean(currentValue && newValue)
  const isRemovingValue = Boolean(currentValue && !newValue)

  if (isAddingNewValue || isReplacingValue) {
    needsReparenting ||= currentValue?.parent !== newValue!.parent

    entity.position.copyFrom(newValue!.position)
    entity.scaling.copyFrom(newValue!.scale)

    if (!entity.rotationQuaternion) {
      entity.rotationQuaternion = newValue!.rotation
    } else {
      entity.rotationQuaternion.copyFrom(newValue!.rotation)
    }
  } else if (isRemovingValue) {
    // remove current value
    needsReparenting = true

    // set default values for position, scale and rotation
    entity.position.setAll(0)
    if (!entity.rotationQuaternion) {
      entity.rotationQuaternion = Quaternion.Identity()
    } else {
      entity.rotationQuaternion.set(0, 0, 0, 1)
    }
    entity.scaling.setAll(1)
    reparentChildrenToRoot(entity)
  }

  if (needsReparenting) reparentEntity(entity)
}

/**
 * When entities are created we must check if their "ids" are used as parent for
 * other entities. If that is the case, those children must be reparented to this
 * freshly created entity
 */
export function createDefaultTransform(entity: BabylonEntity) {
  const transformContext = getTransformContextForEntity(entity)
  if (transformContext) {
    const reparentQueue = transformContext.pendingParentQueues.get(entity.entityId)
    if (reparentQueue?.size) {
      const ctx = entity.context.deref()
      for (const child of reparentQueue) {
        const childEnity = ctx?.getEntityOrNull(child)
        childEnity && reparentEntity(childEnity)
      }
      reparentQueue.clear()
    }
  }
}

/**
 * This function parents an entity with another one. It implements a queuing logic
 * to create "synthetic" entities if the selected parent doesn't exist yet. This case
 * is common, since CRDT messages are unsorted and batched.
 */
function reparentEntity(entity: BabylonEntity) {
  const context = entity.context.deref()
  const targetParentId: Entity | undefined = entity.ecsComponentValues.transform?.parent

  if (context) {
    if (entity.parent && (entity.parent as BabylonEntity).entityId === targetParentId) return
    if (!targetParentId) {
      // parent with the scene root
      entity.parent = context.rootNode
    } else {
      // parent with other entity
      const parentEntity = context.getEntityOrNull(targetParentId)
      if (parentEntity) {
        // happy path, the parent entity already exists
        entity.parent = parentEntity
      } else {
        entity.parent = context.rootNode
        scheduleFutureReparenting(entity, targetParentId)
      }
    }
  }
}

function scheduleFutureReparenting(entity: BabylonEntity, parentEntityId: Entity) {
  const transformContext = getTransformContextForEntity(entity)
  if (transformContext) {
    let list = transformContext.pendingParentQueues.get(parentEntityId)
    if (!list) {
      list = new Set()
      transformContext.pendingParentQueues.set(parentEntityId, list)
    }
    list.add(entity.entityId)
  }
}

/**
 * This function applies the reparenting logic described in
 * https://adr.decentraland.org/adr/ADR-153, effectively moving all its children
 * entities to the scene root.
 *
 * This function is used while removing the Transform component. Since all components
 * are removed before entity disposal, it is also called while destroying an entity.
 */
function reparentChildrenToRoot(entity: BabylonEntity) {
  const rootNode = entity.context.deref()?.rootNode

  if (rootNode) {
    for (const child of entity.childrenEntities()) {
      child.parent = entity
      scheduleFutureReparenting(child, entity.entityId)
    }
  } else {
    debugger // !panic
  }
}

type InternalTransformContext = {
  pendingParentQueues: Map<Entity, Set<Entity>>
}
const transformContextSymbol = Symbol('transform-component-context')
function getTransformContextForEntity(entity: BabylonEntity): InternalTransformContext | undefined {
  const ctx = entity.context.deref() as any
  if (ctx) {
    let current = ctx[transformContextSymbol]
    if (!current) {
      current = { pendingParentQueues: new Map() }
      ctx[transformContextSymbol] = current
    }
    return current
  }
}
