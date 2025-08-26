import { ComponentType } from "../crdt-internal/components";
import { PBDelayedInterpolation } from "@dcl/protocol/out-js/decentraland/sdk/components/delayed_interpolation.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";

export const delayedInterpolationComponent = declareComponentUsingProtobufJs(PBDelayedInterpolation, 1101, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // the billboard of the ROOT entity 0 cannot be changed by a CRDT message
  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBDelayedInterpolation | null
  entity.appliedComponents.delayedInterpolation = newValue || undefined
})
