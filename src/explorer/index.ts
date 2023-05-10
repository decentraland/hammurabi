import "@babylonjs/inspector"
import { initEngine } from "../lib/babylon";
import { loadRealm } from "../lib/decentraland/realm";
import { loginAsGuest } from "../lib/decentraland/identity/login";
import { activeTransports, refreshTransports, setCurrentIdentity } from "./state";
import { createPositionReporter } from "../lib/decentraland/communications/wire-transport";
import { Quaternion, Vector3 } from "@babylonjs/core";
import { PLAYER_HEIGHT } from "../lib/babylon/scene/logic/static-entities";

// this is our entry point
main()

function main() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element
  const realmInput = document.getElementById('realm-input') as HTMLInputElement

  const { scene, firstPersonCamera } = initEngine(canvas)

  const url = new URLSearchParams(location.search)
  if (url.has('realm')) {
    realmInput.value = url.get('realm')!
  }

  // UI bindings
  async function uiChangeRealm() {
    realmInput.setAttribute('disabled', 'true')
    try {
      const url = await loadRealm(realmInput.value, scene)
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

  uiChangeRealm()

  // TODO: memoize the result of the loginAsGuest in localStorage, right now it generates
  // a new identity each time we reload the page
  loginAsGuest().then(identity => setCurrentIdentity(identity))

  const reportPosition = createPositionReporter(() => activeTransports.values())

  if (!firstPersonCamera.rotationQuaternion) firstPersonCamera.rotationQuaternion = Quaternion.Identity()

  scene.onAfterRenderObservable.add(() => {
    // refresh all the transport connections
    refreshTransports()

    // report the position of the first person camera to all transports
    reportPosition(firstPersonCamera.globalPosition.subtract(new Vector3(0, PLAYER_HEIGHT, 0)), firstPersonCamera.rotationQuaternion, false)
  })
}
