import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBRaycast } from "@dcl/protocol/out-ts/decentraland/sdk/components/raycast.gen";
import { PBRaycastResult } from "@dcl/protocol/out-ts/decentraland/sdk/components/raycast_result.gen";

export const raycastComponent = declareComponentUsingProtobufJs(PBRaycast, 1067, () => { 
  // this function is called when we receive the component and a change needs to be applied to the entity
})

export const raycastResultComponent = declareComponentUsingProtobufJs(PBRaycastResult, 1068, () => {
  // this function is called when we receive the component and a change needs to be applied to the entity
})
