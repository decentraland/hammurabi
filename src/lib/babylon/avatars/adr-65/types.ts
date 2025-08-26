import { PBAvatarShape } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_shape.gen";
import { AssetManager } from "../../scene/AssetManager";
import { AssetContainer } from "@babylonjs/core";
import { Wearable, Emote } from "@dcl/schemas";

export type AvatarShapeWithAssetManagers = PBAvatarShape & {
  loadedWearables: AssetManager[];
  loadedEmotes: AssetManager[]
};

export type WearableWithContainer = {
  container: AssetContainer
  wearable: Wearable
}

export type EmoteWithContainer = {
  container: AssetContainer
  emote: Emote
}