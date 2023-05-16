import { Atom } from "../../misc/atom"
import { signedFetch } from "../identity/signed-fetch"
import { ExplorerIdentity } from "../identity/types"
import { CommsAdapter } from "./types"

// this function returns adapters for the different protocols. in case of receiving a transport instead,
// a stub adapter will be created to wrap the transport
export async function connectAdapter(connStr: string, identity: ExplorerIdentity): Promise<CommsAdapter> {
  const ix = connStr.indexOf(':')
  const protocol = connStr.substring(0, ix)
  const url = connStr.substring(ix + 1)

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
    case 'signed-login': {
      // this communications protocol signals a "required handshake" to connect
      // to a server which requires a signature from part of the user in order
      // to authenticate them
      const result = await signedFetch(
        url,
        identity.authChain,
        { method: 'POST', responseBodyType: 'json' },
        {
          intent: 'dcl:explorer:comms-handshake',
          signer: 'dcl:explorer',
          isGuest: identity.isGuest
        }
      )

      const response: SignedLoginResult = result.json
      if (!result.ok || typeof response !== 'object') {
        throw new Error(
          'There was an error acquiring the communications connection. Decentraland will try to connect to another realm'
        )
      }

      type SignedLoginResult = {
        fixedAdapter?: string
        message?: string
      }

      if (typeof response.fixedAdapter === 'string' && !response.fixedAdapter.startsWith('signed-login:')) {
        return {
          desiredTransports: Atom<string[]>([response.fixedAdapter]),
          reportPosition(position) {
            // stub
          },
          disconnect() {
            // stub
          }
        }
      }

      if (typeof response.message === 'string') {
        throw new Error(`There was an error acquiring the communications connection: ${response.message}`)
      }

      throw new Error(`An unknown error was detected while trying to connect to the selected realm.`)
    }
  }
  throw new Error(`A communications adapter could not be created for protocol=${protocol}`)
}
