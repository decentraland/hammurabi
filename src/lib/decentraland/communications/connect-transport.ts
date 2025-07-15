import { Engine, Scene } from "@babylonjs/core"
import { ExplorerIdentity } from "../identity/types"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { LivekitAdapter } from "./transports/livekit"
import { WebSocketAdapter } from "./transports/ws-room"
import { Atom } from "../../misc/atom"
import { currentRealm } from "../../../explorer/state"
import { LOCAL_PREVIEW_SCENE_ID } from "../../babylon/scene/load"

export function connectTransport(connStr: string, identity: ExplorerIdentity, scene: Scene, microphone: Atom<string>, audioContext: AudioContext): CommsTransportWrapper {
  const ix = connStr.indexOf(':')
  const protocol = connStr.substring(0, ix)
  const url = connStr.substring(ix + 1)
  const isLocalPreview = currentRealm.getOrNull()?.aboutResponse.configurations?.realmName === "LocalPreview"

  switch (protocol) {
    // case 'offline': {
    //   return new Rfc4RoomConnection(new OfflineAdapter())
    // }
    case 'ws-room': {
      const finalUrl = !url.startsWith('ws:') && !url.startsWith('wss:') ? 'wss://' + url : url
      return new CommsTransportWrapper(new WebSocketAdapter(finalUrl, identity), isLocalPreview ? LOCAL_PREVIEW_SCENE_ID : 'TODO')
    }
    case 'livekit': {
      const theUrl = new URL(url)
      const token = theUrl.searchParams.get('access_token')
      if (!token) {
        throw new Error('No access token')
      }
      return new CommsTransportWrapper(
        new LivekitAdapter({
          url: theUrl.origin + theUrl.pathname,
          token,
          scene,
          microphone,
          audioContext
        }),
        isLocalPreview ? LOCAL_PREVIEW_SCENE_ID : 'TODO'
      )
    }
  }
  throw new Error(`A communications transport could not be created for protocol=${protocol}`)
}