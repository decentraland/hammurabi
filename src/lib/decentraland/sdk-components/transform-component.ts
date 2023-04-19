import { Quaternion, Vector3 } from "@babylonjs/core";
import { ComponentDeclaration, ComponentType } from "../crdt-internal/components";
import { Entity } from "../types";

export type Transform = {
  position: Vector3
  scale: Vector3
  rotation: Quaternion
  parent: Entity
}

export const transformComponent: ComponentDeclaration<Transform, 1> = {
  componentId: 1,
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
  applyChanges(entity, componentStorage) {
    // this function is called when we receive a CRDT put/delete message and a change of state needs
    // to be applied to the BabylonEntity

    if (componentStorage.componentType !== ComponentType.LastWriteWinElementSet) return

    // the transform of the ROOT entity 0 cannot be changed by a CRDT message
    if (entity.entityId === 0) return

    const newValue = componentStorage.getOrNull(entity.entityId) as Transform | null
    const currentValue = entity.appliedComponents.transform
    entity.appliedComponents.transform = newValue || undefined

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
      // set default values for position, scale and rotation
      entity.position.setAll(0)
      if (!entity.rotationQuaternion) {
        entity.rotationQuaternion = Quaternion.Identity()
      } else {
        entity.rotationQuaternion.set(0, 0, 0, 1)
      }
      entity.scaling.setAll(1)
    }

    if (needsReparenting || isRemovingValue) {
      const context = entity.context.deref()

      if (context) {
        context.hierarchyChanged = true
        // schedule the parenting of the entity
        context.unparentedEntities.add(entity.entityId)
      }
    }
  }
}
