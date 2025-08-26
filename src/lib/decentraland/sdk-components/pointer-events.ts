import * as BABYLON from '@babylonjs/core'
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBPointerEvents } from "@dcl/protocol/out-js/decentraland/sdk/components/pointer_events.gen";
import { ComponentType } from "../crdt-internal/components";

// TODO: this component is a stub that will be replaced by the real implementation later in a dedicated PR
export const pointerEventsComponent = declareComponentUsingProtobufJs(PBPointerEvents, 1062, (entity, component) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = component.get(entity.entityId)

  // update value
  entity.appliedComponents.pointerEvents = newValue || undefined
})
