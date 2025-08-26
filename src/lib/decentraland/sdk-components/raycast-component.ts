import * as BABYLON from '@babylonjs/core'
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBRaycast } from "@dcl/protocol/out-js/decentraland/sdk/components/raycast.gen";
import { PBRaycastResult } from "@dcl/protocol/out-js/decentraland/sdk/components/raycast_result.gen";
import { ComponentType } from "../crdt-internal/components";
import { Vector3 } from '@babylonjs/core';

export const raycastComponent = declareComponentUsingProtobufJs(PBRaycast, 1067, (entity, component) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const prevValue = entity.appliedComponents.raycast
  const shouldCreateNewRay = Boolean(component.has(entity.entityId) && !prevValue)
  const shouldDeleteRay = !component.has(entity.entityId)

  const context = entity.context.deref()

  if (shouldCreateNewRay) {
    const raycast = component.get(entity.entityId)!
    const ray = new BABYLON.Ray(Vector3.Zero(), Vector3.Forward(), 999)
    entity.appliedComponents.raycast = {
      value: raycast!,
      ray
    }

    if (raycast.continuous) {
      const rayHelper = entity.appliedComponents.raycast!.helper = new BABYLON.RayHelper(ray);
      rayHelper.show(entity.getScene());
    }

    if (context)
      context.pendingRaycastOperations.add(entity.entityId)
  } else if (shouldDeleteRay && prevValue) {
    if (prevValue.helper) {
      prevValue.helper.dispose()
    }

    if (context)
      context.pendingRaycastOperations.delete(entity.entityId)

    delete entity.appliedComponents.raycast
  }
})

export const raycastResultComponent = declareComponentUsingProtobufJs(PBRaycastResult, 1068, () => {
  // this function is called when we receive the component and a change needs to be applied to the entity
})
