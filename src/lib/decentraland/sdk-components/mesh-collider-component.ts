import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBMeshCollider } from "@dcl/protocol/out-ts/decentraland/sdk/components/mesh_collider.gen";
import { ComponentType } from "../crdt-internal/components";
import { MeshBuilder } from '@babylonjs/core';


// TODO: this component is a stub that will be replaced by the real implementation later in a dedicated PR
export const meshColliderComponent = declareComponentUsingProtobufJs(PBMeshCollider, 1019, (entity, componentStorage) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (componentStorage.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = componentStorage.getOrNull(entity.entityId)
  const currentValue = entity.appliedComponents.meshCollider

  const isAddingNewValue = Boolean(!currentValue && newValue)
  const isReplacingValue = Boolean(currentValue && newValue)
  const isRemovingValue = Boolean(currentValue && !newValue)

  if (isReplacingValue || isRemovingValue) {
    if (currentValue?.collider) {
      currentValue.collider.dispose()
    }
  }

  if (isAddingNewValue || isReplacingValue) {
    // create a box and attach it to an entity
    const baseBox = MeshBuilder.CreateBox('collider-box', {
      updatable: false,
    })
    baseBox.checkCollisions = true
    baseBox.parent = entity

    entity.appliedComponents.meshCollider = {
      collider: baseBox,
      info: newValue!
    }
  }
})
