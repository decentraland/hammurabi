// This file should hold the "state" of the application

import { SceneContext } from "../lib/babylon/scene/scene-context";
import { ExplorerIdentity } from "../lib/decentraland/identity/types";
import { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen";
import { loadSceneContext, unloadScene } from "../lib/babylon/scene/load";
import { Scene } from "@babylonjs/core";
import { Atom } from "../lib/misc/atom";
import { CommsAdapter } from "../lib/decentraland/communications/types";
import { connectAdapter } from "../lib/decentraland/communications/connect-adapter";
import { CommsTransportWrapper } from "../lib/decentraland/communications/CommsTransportWrapper";
import { connectTransport } from "../lib/decentraland/communications/connect-transport";
import { wireTransportEvents } from "../lib/decentraland/communications/wire-transport";
import { VirtualScene } from "../lib/decentraland/virtual-scene";
import { createAvatarVirtualScene } from "../lib/decentraland/communications/comms-virtual-scene";

export const userEntity = Atom<ExplorerIdentity>()
export const currentRealm = Atom<AboutResponse>()
export const currentAdapter = Atom<CommsAdapter>()
export const loadedScenesByEntityId = new Map<string /* EntityID, not URN */, SceneContext>()
export const activeTransports = new Map<string /* connectionString */, CommsTransportWrapper>()
export const avatarVirtualScene = createAvatarVirtualScene()

currentRealm.observable.add(async function connectNewCommsAdapter(realm: AboutResponse) {
  const identity = await userEntity.deref()
  const newAdapter = await connectAdapter(realm.comms?.fixedAdapter ?? "offline:offline", identity)
  currentAdapter.swap(newAdapter)?.disconnect()
})

export async function setCurrentRealm(realm: AboutResponse, scene: Scene) {
  currentRealm.swap(realm)

  // destroy all scenes, copy the loadedScenesByEntityId into an array to avoid
  // errors caused by mutations of the loadedScenesByEntityId
  for (const entityId of Array.from(loadedScenesByEntityId.keys())) {
    unloadScene(entityId)
  }

  // now that all scenes are destroyed, load the new realm
  if (realm.configurations?.scenesUrn) {
    for (const urn of realm.configurations?.scenesUrn) {
      await loadSceneContext(scene, urn, avatarVirtualScene)

      // teleport the camera to the first scene
      if (loadedScenesByEntityId.size == 1) {
        const [first] = loadedScenesByEntityId
        scene.activeCamera!.position.copyFrom(first[1].rootNode.position)
        scene.activeCamera!.position.y = 2
      }
    }
  }
}

export function setCurrentIdentity(indentity: ExplorerIdentity) {
  userEntity.swap(indentity)

  console.log(`🔑 Logged in`, indentity)
}

// setDesiredAdapters connects the adapters that are not connected yet and disconnects the ones that are not desired anymore
async function setDesiredAdapters(connectionStrings: string[]) {
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
      const identity = await userEntity.deref()

      const transport = connectTransport(connectionString, identity)

      // store the handle of the active transport
      activeTransports.set(connectionString, transport)

      // and then hook into its connection events
      transport.events.on('DISCONNECTION', (e) => {
        console.error(`${connectionString} disconnected`, e)
        activeTransports.delete(connectionString)
      })

      wireTransportEvents(transport)

      avatarVirtualScene.wireTransportEvents(transport.events)

      transport.connect().then(() => {
        console.log(`🔌 Connected to ${connectionString}`)
      }).catch((e) => {
        console.error(`❌ Could not connect to ${connectionString}`, e)
      })
    }
  }
}

// this connection is used to refresh the transports when the list of desired transports change
export async function refreshTransports() {
  const desiredTransports = await getDesiredTransports()
  setDesiredAdapters(desiredTransports)
}

// this function returns the absolute list of transports that should be connected
// for the moment it only takes the desired transports from the CommsAdapter only
export async function getDesiredTransports(): Promise<string[]> {
  const ret = []
  const adapter = currentAdapter.getOrNull()
  if (adapter) {
    ret.push(...(await adapter.desiredTransports.deref()))
  }
  // TODO: here we add more desired transports from i.e. the scenes
  return ret
}
