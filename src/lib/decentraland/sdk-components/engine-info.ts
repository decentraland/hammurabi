
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBEngineInfo } from "@dcl/protocol/out-js/decentraland/sdk/components/engine_info.gen";

export const engineInfoComponent = declareComponentUsingProtobufJs(PBEngineInfo, 1048, () => void 0)
