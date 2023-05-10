import { ExplorerIdentity } from "../identity/types"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { WebSocketAdapter } from "./transports/ws-room"

export function connectTransport(connStr: string, identity: ExplorerIdentity): CommsTransportWrapper {
  const ix = connStr.indexOf(':')
  const protocol = connStr.substring(0, ix)
  const url = connStr.substring(ix + 1)

  switch (protocol) {
    // case 'offline': {
    //   return new Rfc4RoomConnection(new OfflineAdapter())
    // }
    case 'ws-room': {
      const finalUrl = !url.startsWith('ws:') && !url.startsWith('wss:') ? 'wss://' + url : url

      return new CommsTransportWrapper(new WebSocketAdapter(finalUrl, identity))
    }
  }
  throw new Error(`A communications transport could not be created for protocol=${protocol}`)
}