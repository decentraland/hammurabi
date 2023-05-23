import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen"
import { Atom } from "../../misc/atom"
import { ExplorerIdentity } from "../identity/types"
import { connectAdapter } from "./connect-adapter"
import { connectTransport } from "./connect-transport"
import { CommsAdapter, commsLogger } from "./types"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { resolveRealmBaseUrl } from "../realm/resolution"
import { Scene } from "@babylonjs/core"
import { CurrentRealm } from "../../../explorer/state"

/**
 * This system is in charge to handle realm connections and connect/disconnect transports accordingly.
 */
export function createRealmCommunicationSystem(userIdentity: Atom<ExplorerIdentity>, currentRealm: Atom<CurrentRealm>, scene: Scene, microphone: Atom<string>, audioContext: AudioContext) {
  const currentAdapter = Atom<CommsAdapter>()
  const activeTransports = new Map<string, CommsTransportWrapper>()

  currentRealm.observable.add(async function connectNewCommsAdapter(realm: CurrentRealm) {
    const identity = await userIdentity.deref()
    const newAdapter = await connectAdapter(realm.aboutResponse.comms?.fixedAdapter ?? "offline:offline", identity)
    const oldAdapter = currentAdapter.swap(newAdapter)
    if (oldAdapter) {
      oldAdapter.disconnect()
    }
  })

  // this function returns the absolute list of transports that should be connected
  // for the moment it only takes the desired transports from the CommsAdapter only
  function getDesiredTransports(): string[] {
    const ret = []
    const adapter = currentAdapter.getOrNull()
    if (adapter) {
      const desiredTransports = adapter.desiredTransports.getOrNull()
      if (desiredTransports)
        ret.push(...desiredTransports)
    }
    // TODO: here we add more desired transports from i.e. the scenes
    return ret
  }

  // updateAdapters connects the adapters that are not connected yet and disconnects the ones that are not desired anymore
  // TODO: debounce this function to prevent fast reconnections and DDoSing the servers
  function updateAdapters(connectionStrings: string[]) {
    const identity = userIdentity.getOrNull()
    if (!identity) return

    // first remove all the extra adapters
    for (const [connectionString, connection] of activeTransports) {
      if (!connectionStrings.includes(connectionString)) {
        connection.disconnect().finally(() => {
          commsLogger.log(`removinng not needed transport ${connectionString}`)
          activeTransports.delete(connectionString)
        })
      }
    }

    // then connect all missing transports
    for (const connectionString of connectionStrings) {
      if (!activeTransports.has(connectionString)) {
        const transport = connectTransport(connectionString, identity, scene, microphone, audioContext)

        // store the handle of the active transport
        activeTransports.set(connectionString, transport)

        // and then hook into its connection events
        transport.events.on('DISCONNECTION', (e) => {
          commsLogger.error(`🔌❌ ${connectionString} disconnected`, e)
          if (activeTransports.get(connectionString) === transport) {
            activeTransports.delete(connectionString)
            commsLogger.log(`Removing disconnected transport ${connectionString}`)
          }
        })

        transport.connect().then(() => {
          commsLogger.log(`🔌 Connected to ${connectionString}`)
        }).catch((e) => {
          commsLogger.error(`❌ Could not connect to ${connectionString}`, e)
        })
      }
    }
  }

  let applicationRunning = true
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      applicationRunning = false
    })
  }

  return {
    currentAdapter,
    currentRealm,
    getTransports() {
      return activeTransports.values()
    },
    lateUpdate() {
      // connects and disconnect the transports based on the desired list
      if (applicationRunning) {
        const desiredTransports = getDesiredTransports()
        updateAdapters(desiredTransports)
      }
    }
  }
}

export async function connectRealm(currentRealm: Atom<CurrentRealm>, realmConnectionString: string): Promise<CurrentRealm> {
  // naively, first destroy all created scenes before loading the new realm.
  // in the future many optimization could be applied here, like only destroying
  // the scenes that will be replaced by the new realm.
  const baseUrl = (await resolveRealmBaseUrl(realmConnectionString)).replace(/\/$/, '')

  // fetch the standard /about endpoint for the realm
  const res = await fetch(baseUrl + '/about')
  if (res.ok) {
    const aboutResponse = await res.json() as AboutResponse
    const newRealm: CurrentRealm = {
      baseUrl,
      connectionString: realmConnectionString,
      aboutResponse
    }
    currentRealm.swap(newRealm)
    return newRealm
  }

  throw new Error(`Could not load the realm ${realmConnectionString}`)
}

