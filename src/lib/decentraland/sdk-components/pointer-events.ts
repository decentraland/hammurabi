import * as BABYLON from '@babylonjs/core'
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBPointerEvents } from "@dcl/protocol/out-ts/decentraland/sdk/components/pointer_events.gen";
import { ComponentType } from "../crdt-internal/components";
import { entityHasPointerEvents } from '../../babylon/scene/pointer-events';
import { BabylonEntity } from '../../babylon/scene/entity';
import { isColliderMesh } from '../../babylon/scene/colliders';

// TODO: this component is a stub that will be replaced by the real implementation later in a dedicated PR
export const pointerEventsComponent = declareComponentUsingProtobufJs(PBPointerEvents, 1062, (entity, component) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = component.get(entity.entityId)

  // update value
  entity.appliedComponents.pointerEvents = newValue || undefined

  // side effects
  if (entity.appliedComponents.meshRenderer?.mesh) {
    updatePointerEventsMeshProperties(entity, entity.appliedComponents.meshRenderer.mesh)
  }

  if (entity.appliedComponents.gltfContainer?.instancedEntries) {
    entity.appliedComponents.gltfContainer.instancedEntries.rootNodes.forEach((entry) => {
      updatePointerEventsMeshProperties(entity, entry)
    })
  }
})

// call this function to update the pickable state of a mesh or transform node, it
// applies the change recursivly to all descendants
export function updatePointerEventsMeshProperties(entity: BabylonEntity, mesh: BABYLON.TransformNode) {
  const isPickable = entityHasPointerEvents(entity)
  if (mesh instanceof BABYLON.AbstractMesh) {
    mesh.isPickable = isPickable && isColliderMesh(mesh)
  }
  mesh.getChildMeshes(false).forEach((mesh) => {
    mesh.isPickable = isPickable && isColliderMesh(mesh)
  })
}