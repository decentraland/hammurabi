
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBAvatarEmoteCommand } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_emote_command.gen";
import { PBAvatarEquippedData } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_equipped_data.gen";

export const avatarEmoteCommandComponent = declareComponentUsingProtobufJs(PBAvatarEmoteCommand, 1088, () => void 0)
export const avatarEquippedDataComponent = declareComponentUsingProtobufJs(PBAvatarEquippedData, 1091, () => void 0)
