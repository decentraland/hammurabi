import { userIdentity } from "../state"
import { getLoadableSceneFromLocalContext } from "../../babylon/scene/load"
import { Atom } from "../../misc/atom"
import { signedFetch } from "../identity/signed-fetch"
import { ExplorerIdentity } from "../identity/types"
import { CommsAdapter } from "./types"

// TODO: this should be an env var
const COMMS_GATEKEEPER_URL = 'http://localhost:3000/get-server-scene-adapter'
// 'https://comms-gatekeeper-local.decentraland.org/get-scene-adapter' 

export async function connectLocalAdapter(baseUrl: string) {
  const { urn } = await getLoadableSceneFromLocalContext(baseUrl)
  const identity = await userIdentity.deref()
  try {
    const result = await signedFetch(
      COMMS_GATEKEEPER_URL,
      identity.authChain,
      { method: 'POST', responseBodyType: 'json' },
      {
        intent: 'dcl:explorer:comms-handshake',
        signer: 'dcl:explorer',
        isGuest: identity.isGuest,
        realm: {
          serverName: 'LocalPreview'
        },
        realmName: 'LocalPreview',
        sceneId: urn,
      }
    )
    if (result.ok && result.json.adapter) {
      return await connectAdapter(result.json.adapter, identity, urn)
    }
    throw 'Invalid livekit connection'
  } catch (e) {
    console.log(e)
    throw e
  }
}
  

// this function returns adapters for the different protocols. in case of receiving a transport instead,
// a stub adapter will be created to wrap the transport
export async function connectAdapter(connStr: string, identity: ExplorerIdentity, sceneId: string): Promise<CommsAdapter> {
  const ix = connStr.indexOf(':')
  const protocol = connStr.substring(0, ix)
  const url = connStr.substring(ix + 1)

  switch (protocol) {
    case 'livekit': {
      return {
        reportPosition(position) {
          // stub
        },
        desiredTransports: Atom([{ url: connStr, sceneId }]),
        disconnect() {
          // stub
        }
      } 
    }
    case 'offline': {
      return {
        reportPosition(position) {
          // stub
        },
        desiredTransports: Atom([{ url: '', sceneId }]),
        disconnect() {
          // stub
        }
      }
    }
    case 'ws-room': {
      return {
        desiredTransports: Atom([{ url: connStr, sceneId }]),
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
      console.log('[BOEDO]', { response })

      type SignedLoginResult = {
        fixedAdapter?: string
        message?: string
      }

      if (typeof response.fixedAdapter === 'string' && !response.fixedAdapter.startsWith('signed-login:')) {
        return {
          desiredTransports: Atom([{ url: response.fixedAdapter, sceneId }]),
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
