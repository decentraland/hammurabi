import "@babylonjs/inspector"
import { initEngine } from "../lib/babylon";
import { loginAsGuest } from "../lib/decentraland/identity/login";
import { loadedScenesByEntityId, setCurrentIdentity, userIdentity } from "./state";
import { createCommunicationsPositionReportSystem } from "../lib/decentraland/communications/position-report-system";
import { createNetworkedAvatarSystem } from "../lib/decentraland/communications/networked-avatar-system";
import { generateRandomAvatar } from "../lib/decentraland/identity/avatar";
import { addSystems } from "../lib/decentraland/system";
import { createAvatarVirtualSceneSystem } from "../lib/decentraland/communications/comms-virtual-scene-system";
import { createAvatarRendererSystem } from "../lib/babylon/avatar-rendering-system";
import { createRealmCommunicationSystem } from "../lib/decentraland/communications/realm-communications-system";
import { loadSceneContext, unloadScene } from "../lib/babylon/scene/load";

// this is our entry point
main()

function main() {
  // <WIRING>
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element

  const { scene, firstPersonCamera } = initEngine(canvas)

  const realmCommunicationSystem = createRealmCommunicationSystem(userIdentity)
  const positionReportSystem = createCommunicationsPositionReportSystem(realmCommunicationSystem.getTransports, firstPersonCamera)
  const networkedAvatarController = createNetworkedAvatarSystem(realmCommunicationSystem.getTransports)
  const avatarVirtualScene = createAvatarVirtualSceneSystem(realmCommunicationSystem.getTransports)
  const avatarRenderingSystem = createAvatarRendererSystem(scene, () => loadedScenesByEntityId.values())

  addSystems(scene,
    realmCommunicationSystem,
    positionReportSystem,
    networkedAvatarController,
    avatarVirtualScene,
    avatarRenderingSystem
  )

  // when the realm changes, we need to destroy extra scenes and load the new ones
  realmCommunicationSystem.currentRealm.observable.add(async realm => {
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
  })

  // generate a random avatar based on our identity
  userIdentity.observable.add(async identity => {
    networkedAvatarController.setAvatar(await generateRandomAvatar(identity.address))
  })


  configureRealmSelectionUi(realmCommunicationSystem.connectRealm)
  // </WIRING>

  // TODO: memoize the result of the loginAsGuest in localStorage, right now it generates
  // a new identity each time we reload the page
  loginAsGuest().then(identity => setCurrentIdentity(identity))
}

function configureRealmSelectionUi(changeRealm: (connectionString: string) => Promise<any>) {
  const realmInput = document.getElementById('realm-input') as HTMLInputElement
  const url = new URLSearchParams(location.search)
  if (url.has('realm')) {
    realmInput.value = url.get('realm')!
  }

  // UI bindings
  async function uiChangeRealm() {
    realmInput.setAttribute('disabled', 'true')
    try {
      const url = await changeRealm(realmInput.value)
      realmInput.value = url
    } finally {
      realmInput.removeAttribute('disabled')
    }
  }

  realmInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      uiChangeRealm()
    }
  })

  setTimeout(uiChangeRealm, 0)
}