import { ComponentType } from "../crdt-internal/components";
import { PBBillboard } from "@dcl/protocol/out-js/decentraland/sdk/components/billboard.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";

export const billboardComponent = declareComponentUsingProtobufJs(PBBillboard, 1090, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // the billboard of the ROOT entity 0 cannot be changed by a CRDT message
  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBBillboard | null
  entity.appliedComponents.billboard = newValue || undefined
})
