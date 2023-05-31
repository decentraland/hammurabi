// This file should hold the "state" of the application

import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen";
import { SceneContext } from "../lib/babylon/scene/scene-context";
import { ExplorerIdentity } from "../lib/decentraland/identity/types";
import { Atom } from "../lib/misc/atom";

export type CurrentRealm = {
  baseUrl: string
  connectionString: string
  aboutResponse: AboutResponse
}

export const userIdentity = Atom<ExplorerIdentity>()
export const currentRealm = Atom<CurrentRealm>()
export const selectedInputVoiceDevice = Atom<string>()
export const voiceChatAvailable = Atom<boolean>()
export const mutedMicrophone = Atom<boolean>(true)
export const userDidInteract = Atom<boolean>(false)
export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()
export const realmErrors = Atom<string[]>()
export const loadingState = Atom<{ pending: number, total: number }>()