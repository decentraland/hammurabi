import { PBAvatarShape } from "@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen";
import { AssetManager } from "../../scene/AssetManager";

export type LoadableAvatarConfig = PBAvatarShape & {
  loadedWearables: AssetManager[];
  loadedEmotes: AssetManager[]
};
