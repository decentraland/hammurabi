import { ComponentType } from "../crdt-internal/components";
import { PBTween } from "@dcl/protocol/out-js/decentraland/sdk/components/tween.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";

export const tweenComponent = declareComponentUsingProtobufJs(PBTween, 1102, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // the billboard of the ROOT entity 0 cannot be changed by a CRDT message
  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBTween | null
  entity.appliedComponents.tween = newValue || undefined
})
