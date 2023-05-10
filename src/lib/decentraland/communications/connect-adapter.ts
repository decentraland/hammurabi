import { Atom } from "../../misc/atom"
import { ExplorerIdentity } from "../identity/types"
import { CommsAdapter } from "./types"

// this function returns adapters for the different protocols. in case of receiving a transport instead,
// a stub adapter will be created to wrap the transport
export async function connectAdapter(connStr: string, _identity: ExplorerIdentity): Promise<CommsAdapter> {
  const ix = connStr.indexOf(':')
  const protocol = connStr.substring(0, ix)
  const _url = connStr.substring(ix + 1)

  switch (protocol) {
    case 'offline': {
      return {
        reportPosition(position) {
          // stub
        },
        desiredTransports: Atom<string[]>(),
        disconnect() {
          // stub
        }
      }
    }
    case 'ws-room': {
      return {
        desiredTransports: Atom<string[]>([connStr]),
        reportPosition(position) {
          // stub
        },
        disconnect() {
          // stub
        }
      }
    }
  }
  throw new Error(`A communications adapter could not be created for protocol=${protocol}`)
}
