import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen"
import { Atom } from "../../misc/atom"
import { ExplorerIdentity } from "../identity/types"
import { connectAdapter } from "./connect-adapter"
import { connectTransport } from "./connect-transport"
import { CommsAdapter } from "./types"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { resolveRealmBaseUrl } from "../realm/resolution"

/**
 * This system is in charge to handle realm connections and connect/disconnect transports accordingly.
 */
export function createRealmCommunicationSystem(userIdentity: Atom<ExplorerIdentity>) {
  const currentAdapter = Atom<CommsAdapter>()
  const currentRealm = Atom<AboutResponse>()
  const activeTransports = new Map<string, CommsTransportWrapper>()

  currentRealm.observable.add(async function connectNewCommsAdapter(realm: AboutResponse) {
    const identity = await userIdentity.deref()
    const newAdapter = await connectAdapter(realm.comms?.fixedAdapter ?? "offline:offline", identity)
    currentAdapter.swap(newAdapter)?.disconnect()
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
  async function updateAdapters(connectionStrings: string[]) {
    // first remove all the extra adapters
    for (const [connectionString, connection] of activeTransports) {
      if (!connectionStrings.includes(connectionString)) {
        connection.disconnect()
        activeTransports.delete(connectionString)
      }
    }

    // then connect all missing transports
    for (const connectionString of connectionStrings) {
      if (!activeTransports.has(connectionString)) {
        const identity = await userIdentity.deref()

        const transport = connectTransport(connectionString, identity)

        // store the handle of the active transport
        activeTransports.set(connectionString, transport)

        // and then hook into its connection events
        transport.events.on('DISCONNECTION', (e) => {
          console.error(`${connectionString} disconnected`, e)
          activeTransports.delete(connectionString)
        })

        transport.connect().then(() => {
          console.log(`🔌 Connected to ${connectionString}`)
        }).catch((e) => {
          console.error(`❌ Could not connect to ${connectionString}`, e)
        })
      }
    }
  }

  return {
    currentAdapter,
    currentRealm,
    async connectRealm(realmConnectionString: string) {
      // naively, first destroy all created scenes before loading the new realm.
      // in the future many optimization could be applied here, like only destroying
      // the scenes that will be replaced by the new realm.

      const url = (await resolveRealmBaseUrl(realmConnectionString)).replace(/\/$/, '')

      // fetch the standard /about endpoint for the realm
      const res = await fetch(url + '/about')
      if (res.ok) {
        const realm = await res.json() as AboutResponse
        currentRealm.swap(realm)
      }

      // TODO: gracefully handle errors

      return url
    },
    getTransports() {
      return activeTransports.values()
    },
    lateUpdate() {
      // connects and disconnect the transports based on the desired list
      const desiredTransports = getDesiredTransports()
      updateAdapters(desiredTransports)
    }
  }
}


