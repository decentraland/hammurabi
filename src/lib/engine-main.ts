// Node.js 18+ has native fetch
import * as BABYLON from '@babylonjs/core'
import { Scene } from '@dcl/schemas'
import { initEngine } from './babylon'
import { createAvatarRendererSystem } from './babylon/avatar-rendering-system'
import { loadSceneContextFromLocal } from './babylon/scene/load'
import { PLAYER_HEIGHT } from './babylon/scene/logic/static-entities'
import { createSceneCullingSystem } from './babylon/scene/scene-culling'
import { createSceneTickSystem } from './babylon/scene/update-scheduler'
import { createCharacterControllerSystem } from './babylon/avatars/CharacterController'
import { createCameraFollowsPlayerSystem } from './babylon/scene/logic/camera-follows-player'
import { createCameraObstructionSystem } from './babylon/scene/logic/hide-camera-obstuction-system'
import { createLocalAvatarSceneSystem } from './babylon/scene/logic/local-avatar-scene'
import { createSceneComms } from './decentraland/communications/scene-comms'
import { SceneContext } from './babylon/scene/scene-context'
import { generateRandomAvatar, downloadAvatar } from './decentraland/identity/avatar'
import { pickWorldSpawnpoint } from './decentraland/scene/spawn-points'
import { addSystems } from './decentraland/system'
import { Atom } from './misc/atom'
import { userIdentity, loadedScenesByEntityId, currentRealm, playerEntityAtom, CurrentRealm } from './decentraland/state'
import { createGuestIdentity } from './decentraland/identity/login'
import { resolveRealmBaseUrl } from './decentraland/realm/resolution'

// we only spend ONE millisecond per frame procesing messages from scenes,
// it is a conservative number but we want to prioritize CPU time for rendering
const MS_PER_FRAME_PROCESSING_SCENE_MESSAGES = 10

export interface EngineOptions {
  canvas?: HTMLCanvasElement
  realmUrl?: string
}

let initialized = false

export async function main(options: EngineOptions = {}): Promise<BABYLON.Scene> {
  if (initialized) {
    throw new Error('The engine cannot be initialized twice')
  }

  initialized = true
  const { scene } = await initEngine(options.canvas)

  // Always create a guest account
  const guestIdentity = await createGuestIdentity()
  userIdentity.swap(guestIdentity)
  const identity = guestIdentity
  
  // Fetch realm if URL provided, otherwise use default
  let realm: CurrentRealm
  if (options.realmUrl) {
    const baseUrl = options.realmUrl.startsWith('http') ? options.realmUrl : `http://${options.realmUrl}`
    
    console.log('🌐 Fetching realm info from:', baseUrl + '/about')
    const res = await fetch(baseUrl + '/about')
    const aboutResponse = (await res.json() as any)
    realm = {
      baseUrl,
      connectionString: options.realmUrl,
      aboutResponse
    }
    currentRealm.swap(realm)
  } else {
    realm = await currentRealm.deref()
  }
  
  // Create identity atom for sceneComms
  const identityAtom = Atom(guestIdentity)
  
  // init the character controller and input system
  const characterControllerSystem = await createCharacterControllerSystem(scene)

  // then init all the rendering systems
  const avatar = guestIdentity.isGuest ? await generateRandomAvatar(guestIdentity.address) : await downloadAvatar(guestIdentity.address)
  const avatarRenderingSystem = createAvatarRendererSystem(scene, () => loadedScenesByEntityId.values())
  const sceneCullingSystem = createSceneCullingSystem(scene, () => loadedScenesByEntityId.values())
  const sceneTickSystem = createSceneTickSystem(scene, () => loadedScenesByEntityId.values(), MS_PER_FRAME_PROCESSING_SCENE_MESSAGES)
  const localAvatarSceneSystem = await createLocalAvatarSceneSystem(scene, avatar)
  const cameraFollowsPlayerSystem = createCameraFollowsPlayerSystem(characterControllerSystem.camera, localAvatarSceneSystem.playerEntity, characterControllerSystem)
  const cameraObstructionSystem = createCameraObstructionSystem(scene, characterControllerSystem.camera)

  // Use player entity atom if it exists
  if (typeof playerEntityAtom !== 'undefined') {
    playerEntityAtom.swap(characterControllerSystem.capsule)
  }

  addSystems(scene,
    sceneTickSystem,
    avatarRenderingSystem,
    sceneCullingSystem,
    characterControllerSystem,
    localAvatarSceneSystem,
    cameraFollowsPlayerSystem,
    cameraObstructionSystem
  )

  const sceneContext: Atom<SceneContext> = Atom()
  
  // Enable scene comms with Node.js compatible LiveKit
  const sceneTransport = await createSceneComms(realm, identityAtom, scene)
  sceneContext.pipe(async (ctx) => {
    ctx.attachLivekitTransport(sceneTransport)
  })
  const ctx = await loadSceneContextFromLocal(sceneContext, scene, { baseUrl: realm.baseUrl, isGlobal: false })
  
  const { position } = pickWorldSpawnpoint((await ctx.deref()).loadableScene.entity.metadata as Scene)
  characterControllerSystem.teleport(position)
  characterControllerSystem.capsule.position.y += PLAYER_HEIGHT

  // this is for debugging purposes
  Object.assign(globalThis, { scene })

  return scene
}