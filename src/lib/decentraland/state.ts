// Global state atoms for the application

import { AboutResponse } from "@dcl/protocol/out-js/decentraland/realm/about.gen"
import { SceneContext } from "../babylon/scene/scene-context"
import { ExplorerIdentity } from "./identity/types"
import { Atom } from "../misc/atom"
import { TransformNode } from "@babylonjs/core"

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
export const playerEntityAtom = Atom<TransformNode>()
export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()
export const realmErrors = Atom<string[]>()
export const loadingState = Atom<{ pending: number, total: number }>()