import React, { useEffect, useRef, useState } from 'react'
import { initEngine } from '../lib/babylon'
import { createAvatarRendererSystem } from '../lib/babylon/avatar-rendering-system'
import { unloadScene, loadSceneContext } from '../lib/babylon/scene/load'
import { PLAYER_HEIGHT, StaticEntities } from '../lib/babylon/scene/logic/static-entities'
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
import { userIdentity, loadedScenesByEntityId, currentRealm, realmErrors, loadingState, selectedInputVoiceDevice, playerEntityAtom } from './state'
import * as BABYLON from '@babylonjs/core'
import { Scene } from '@dcl/schemas'
import { createCharacterControllerSystem } from '../lib/babylon/avatars/CharacterController'
import { createCameraFollowsPlayerSystem } from '../lib/babylon/scene/logic/camera-follows-player'
import { createCameraObstructionSystem } from '../lib/babylon/scene/logic/hide-camera-obstuction-system'
import { createLocalAvatarSceneSystem } from '../lib/babylon/scene/logic/local-avatar-scene'
import { gridToWorld } from '../lib/decentraland/positions'

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
  const { scene, audioContext } = await initEngine(canvas)
  const gameConsole = addChat(canvas)

  // Watch for browser/canvas resize events
  window.addEventListener('resize', function () {
    scene.getEngine().resize()
  })

  // init the character controller and input system

  const characterControllerSystem = await createCharacterControllerSystem(scene)

  // then init all the rendering systems
  const realmCommunicationSystem = createRealmCommunicationSystem(userIdentity, currentRealm, scene, selectedInputVoiceDevice, audioContext)
  const networkedPositionReportSystem = createCommunicationsPositionReportSystem(realmCommunicationSystem.getTransports, characterControllerSystem.capsule)
  const networkedProfileSystem = createNetworkedProfileSystem(realmCommunicationSystem.getTransports)
  const avatarVirtualScene = createAvatarVirtualSceneSystem(realmCommunicationSystem.getTransports, gameConsole.addConsoleMessage)
  const avatarRenderingSystem = createAvatarRendererSystem(scene, () => loadedScenesByEntityId.values())
  const sceneCullingSystem = createSceneCullingSystem(scene, () => loadedScenesByEntityId.values())
  const sceneTickSystem = createSceneTickSystem(scene, () => loadedScenesByEntityId.values(), MS_PER_FRAME_PROCESSING_SCENE_MESSAGES)
  const localAvatarSceneSystem = await createLocalAvatarSceneSystem(scene, networkedProfileSystem.currentAvatar)
  const cameraFollowsPlayerSystem = createCameraFollowsPlayerSystem(characterControllerSystem.camera, localAvatarSceneSystem.playerEntity, characterControllerSystem)
  const cameraObstructionSystem = createCameraObstructionSystem(scene, characterControllerSystem.camera)

  playerEntityAtom.swap(characterControllerSystem.capsule)

  gameConsole.onChatMessage.add(message => {
    const transports = Array.from(realmCommunicationSystem.getTransports())
    for (const t of transports) {
      t.sendChatMessage({ timestamp: Date.now(), message })
      gameConsole.addConsoleMessage({ message: `You: ${message}`, isCommand: false, color: 0x00cece })
    }
  })

  gameConsole.onTeleportRequested.add((position) => {
    let target: BABYLON.Vector3 = new BABYLON.Vector3()
    gridToWorld(position.x, position.y, target)
    characterControllerSystem.teleport(target)
  })

  realmCommunicationSystem.currentRealm.pipe(realm => {
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

    // character controller to react to user inputs. this system also handles the
    // moving platform mechanics
    characterControllerSystem,

    // the LocalAvatarSceneSystem places the playerEntity on its final 3D place
    localAvatarSceneSystem,

    // update the camera position based on the updated player
    cameraFollowsPlayerSystem,

    // finally adjust the camera position based on obstructions or hide some elements
    // based on the same conditions
    cameraObstructionSystem
  )

  // when the realm changes, we need to destroy extra scenes and load the new ones
  realmCommunicationSystem.currentRealm.pipe(async realm => {
    const errors: string[] = []

    // create an empty set of desired running scenes
    const desiredRunningScenes = new Map<string, { isGlobal: boolean }>()

    // hack: loads genesis plaza
    if (realm.baseUrl === 'https://peer.decentraland.org') {
      // Genesis Plaza
      //desiredRunningScenes.set('urn:decentraland:entity:bafkreihn2msxftdyd3nxqcbxmmzd252xcqongub3tladzsu557kcsomuui?baseUrl=https://peer.decentraland.org/content/contents/', { isGlobal: false })

      // Asian Plaza
      desiredRunningScenes.set('urn:decentraland:entity:QmUBjSNgs9MgDJneARJgpsnvEBJQQ1wMfvqmP7J24iQ23R?baseUrl=https://peer.decentraland.org/content/contents/', { isGlobal: false })
    }

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
        if (!loadedScenesByEntityId.has(urn)) {
          setTimeout(() => {
            if (pendingSet.has(urn)) {
              console.error(`Scene ${urn} timed out loading`)
              pendingSet.delete(urn)
              updatePending()
            }
          }, 60000)
        }

        const ctx = await loadSceneContext(scene, { urn, isGlobal }, avatarVirtualScene)
        ctx.nextTick().finally(() => {
          pendingSet.delete(urn)
          updatePending()
        })
      } catch (err) {
        pendingSet.delete(urn)
        updatePending()
        errors.push(`${err}`)
      }
    }

    // finally teleport to a location in the new realm. pick the first non-global scene
    for (const [_, loadedScene] of loadedScenesByEntityId) {
      if (!loadedScene.isGlobalScene) {
        // activate loading screen
        const { position } = pickWorldSpawnpoint(loadedScene.loadableScene.entity.metadata as Scene)

        characterControllerSystem.teleport(position)
        characterControllerSystem.capsule.position.y += PLAYER_HEIGHT

        loadedScene.nextTick().then(() => {
          // deactivate loading screen
          const { position } = pickWorldSpawnpoint(loadedScene.loadableScene.entity.metadata as Scene)

          characterControllerSystem.teleport(position)
          characterControllerSystem.capsule.position.y += PLAYER_HEIGHT
        })
        break
      }
    }

    realmErrors.swap(errors)
  })

  // generate a random avatar based on our identity
  userIdentity.pipe(async identity => {
    if (identity.isGuest)
      networkedProfileSystem.setAvatar(await generateRandomAvatar(identity.address))
    else
      networkedProfileSystem.setAvatar(await downloadAvatar(identity.address))
  })

  return scene
}
