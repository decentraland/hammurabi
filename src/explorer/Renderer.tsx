import React, { useEffect, useRef, useState } from 'react'
import { initEngine } from '../lib/babylon'
import { createAvatarRendererSystem } from '../lib/babylon/avatar-rendering-system'
import { unloadScene, loadSceneContext } from '../lib/babylon/scene/load'
import { PLAYER_HEIGHT } from '../lib/babylon/scene/logic/static-entities'
import { createSceneCullingSystem } from '../lib/babylon/scene/scene-culling'
import { createSceneTickSystem } from '../lib/babylon/scene/update-scheduler'
import { createAvatarVirtualSceneSystem } from '../lib/decentraland/communications/comms-virtual-scene-system'
import { createNetworkedProfileSystem } from '../lib/decentraland/communications/networked-profile-system'
import { createCommunicationsPositionReportSystem } from '../lib/decentraland/communications/position-report-system'
import { createRealmCommunicationSystem } from '../lib/decentraland/communications/realm-communications-system'
import { generateRandomAvatar, downloadAvatar } from '../lib/decentraland/identity/avatar'
import { pickWorldSpawnpoint } from '../lib/decentraland/scene/spawn-points'
import { addSystems } from '../lib/decentraland/system'
import { addChat } from './console'
import { scenesUrn as avatarSceneRealmSceneUrns } from "./avatar-scene.json";
import { userIdentity, loadedScenesByEntityId, currentRealm, realmErrors, loadingState, selectedInputVoiceDevice } from './state'
import * as BABYLON from '@babylonjs/core'
import { Scene } from '@dcl/schemas'

// we only spend ONE millisecond per frame procesing messages from scenes,
// it is a conservative number but we want to prioritize CPU time for rendering
const MS_PER_FRAME_PROCESSING_SCENE_MESSAGES = 1

export const Renderer: React.FC<{ visible: boolean }> = ({ visible }) => {
  const ref = useRef<HTMLCanvasElement>(null)
  const [scene, setScene] = useState<BABYLON.Scene>()

  useEffect(() => {
    if (ref.current) { main(ref.current).then(setScene) }
  }, [ref])

  useEffect(() => {
    if (scene && visible) {
      requestAnimationFrame(() => {
        scene.getEngine().resize()
      })
    }
  }, [visible, scene])

  return (
    <div className="canvasContainer" style={{ display: visible ? 'block' : 'none' }} >
      <canvas ref={ref} touch-action="none" id="renderCanvas" />
    </div>
  )
}

let initialized = false

async function main(canvas: HTMLCanvasElement): Promise<BABYLON.Scene> {
  if (initialized) {
    debugger
    throw new Error('The engine cannot be initialized twice')
  }

  initialized = true
  const { scene, firstPersonCamera, audioContext } = await initEngine(canvas)
  const gameConsole = addChat(canvas)

  // Watch for browser/canvas resize events
  window.addEventListener('resize', function () {
    scene.getEngine().resize()
  })

  const realmCommunicationSystem = createRealmCommunicationSystem(userIdentity, currentRealm, scene, selectedInputVoiceDevice, audioContext)
  const networkedPositionReportSystem = createCommunicationsPositionReportSystem(realmCommunicationSystem.getTransports, firstPersonCamera)
  const networkedProfileSystem = createNetworkedProfileSystem(realmCommunicationSystem.getTransports)
  const avatarVirtualScene = createAvatarVirtualSceneSystem(realmCommunicationSystem.getTransports, gameConsole.addConsoleMessage)
  const avatarRenderingSystem = createAvatarRendererSystem(scene, () => loadedScenesByEntityId.values())
  const sceneCullingSystem = createSceneCullingSystem(scene, () => loadedScenesByEntityId.values())
  const sceneTickSystem = createSceneTickSystem(scene, () => loadedScenesByEntityId.values(), MS_PER_FRAME_PROCESSING_SCENE_MESSAGES)

  gameConsole.onChatMessage.add(message => {
    const transports = Array.from(realmCommunicationSystem.getTransports())
    for (const t of transports) {
      t.sendChatMessage({ timestamp: Date.now(), message })
      gameConsole.addConsoleMessage({ message: `You: ${message}`, isCommand: false, color: 0x00cece })
    }
  })

  realmCommunicationSystem.currentRealm.observable.add(realm => {
    gameConsole.addConsoleMessage({ message: `🌐 Connected to realm ${realm.aboutResponse.configurations?.realmName}`, isCommand: false })
  })

  addSystems(scene,
    // the realmCommunicationSystem is in charge to handle realm connections and connect/disconnect transports accordingly.
    realmCommunicationSystem,

    // as its name implies, the networked position report system is in charge of
    // broadcasting our position to the rest of the network
    networkedPositionReportSystem,

    // the networked profile system is in charge of announcing updates in our local
    // profile to the rest of the network
    networkedProfileSystem,

    // the avatar virtual scene contains all the player entities (via comms) that are
    // broadcasted/replicated to the rest of the running scenes
    avatarVirtualScene,

    // this system executes the update and lateUpdate functions as defined in ADR-148
    sceneTickSystem,

    // the avatar rendering system iterates over all the AvatarShape of all scenes and marks
    // them as visible or invisible
    avatarRenderingSystem,

    // the sceneCullingSystem uses the base parcels of the scene to cull the 
    // RootEntity and all its descendants
    sceneCullingSystem,
  )

  // when the realm changes, we need to destroy extra scenes and load the new ones
  realmCommunicationSystem.currentRealm.observable.add(async realm => {
    const errors: string[] = []

    // create an empty set of desired running scenes
    const desiredRunningScenes = new Map<string, { isGlobal: boolean }>()

    // first load the desired scenes into the desiredRunningScenes set
    avatarSceneRealmSceneUrns.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: true }))
    realm.aboutResponse.configurations?.scenesUrn.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: false }))
    realm.aboutResponse.configurations?.globalScenesUrn.forEach(urn => desiredRunningScenes.set(urn, { isGlobal: true }))

    const pendingSet = new Set<string>(desiredRunningScenes.keys())

    function updatePending() {
      loadingState.swap({ total: desiredRunningScenes.size, pending: pendingSet.size })
    }

    updatePending()

    // destroy all unwanted scenes, copy the loadedScenesByEntityId into an array to avoid
    // errors caused by mutations of the loadedScenesByEntityId
    for (const entityId of Array.from(loadedScenesByEntityId.keys())) {
      if (!desiredRunningScenes.has(entityId))
        unloadScene(entityId)
    }

    // now that all unwanted scenes are destroyed, load the new realm
    for (const [urn, { isGlobal }] of desiredRunningScenes) {
      try {
        const ctx = await loadSceneContext(scene, { urn, isGlobal }, avatarVirtualScene)
        ctx.nextTick().finally(() => {
          pendingSet.delete(urn)
          updatePending()
        })
      } catch (err) {
        pendingSet.delete(urn)
        errors.push(`${err}`)
      }
    }

    // finally teleport to a location in the new realm. pick the first non-global scene
    for (const [_, loadedScene] of loadedScenesByEntityId) {
      if (!loadedScene.isGlobalScene) {
        // activate loading screen
        const { position } = pickWorldSpawnpoint(loadedScene.loadableScene.entity.metadata as Scene)

        scene.activeCamera!.position.copyFrom(position)
        scene.activeCamera!.position.y += PLAYER_HEIGHT

        loadedScene.nextTick().then(() => {
          // deactivate loading screen
          const { position } = pickWorldSpawnpoint(loadedScene.loadableScene.entity.metadata as Scene)

          scene.activeCamera!.position.copyFrom(position)
          scene.activeCamera!.position.y += PLAYER_HEIGHT
        })
        break
      }
    }

    realmErrors.swap(errors)
  })

  // generate a random avatar based on our identity
  userIdentity.observable.add(async identity => {
    if (identity.isGuest)
      networkedProfileSystem.setAvatar(await generateRandomAvatar(identity.address))
    else
      networkedProfileSystem.setAvatar(await downloadAvatar(identity.address))
  })

  return scene
}