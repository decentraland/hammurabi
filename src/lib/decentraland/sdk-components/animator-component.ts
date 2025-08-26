import { ComponentType } from "../crdt-internal/components";
import { PBAnimator } from "@dcl/protocol/out-js/decentraland/sdk/components/animator.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { applyAnimations } from '../../babylon/scene/logic/apply-animations';

export const animatorComponent = declareComponentUsingProtobufJs(PBAnimator, 1042, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  applyAnimations(entity)
})
