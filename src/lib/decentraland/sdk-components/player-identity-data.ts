
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBPlayerIdentityData } from "@dcl/protocol/out-js/decentraland/sdk/components/player_identity_data.gen";

export const playerIdentityDataComponent = declareComponentUsingProtobufJs(PBPlayerIdentityData, 1089, () => void 0)
