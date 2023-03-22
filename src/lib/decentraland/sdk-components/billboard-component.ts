import { ComponentType } from "../crdt-internal/components";
import { PBBillboard } from "@dcl/protocol/out-ts/decentraland/sdk/components/billboard.gen";
import type { ComponentOperation } from '.'
import { createSerDeFromProtobufJs } from "./pb-based-component-helper";

export const BILLBOARD_COMPONENT_ID = 1090

export const billboardSerDe = createSerDeFromProtobufJs(PBBillboard)

export const putBillboardComponent: ComponentOperation = (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // the billboard of the ROOT entity 0 cannot be changed by a CRDT message
  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBBillboard | null
  entity.ecsComponentValues.billboard = newValue || undefined
}