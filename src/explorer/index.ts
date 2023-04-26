import "@babylonjs/inspector"
import { initEngine } from "../lib/babylon";
import { loadedScenesByEntityId, loadSceneContext, unloadScene } from "../lib/babylon/scene/load";
import { resolveRealmBaseUrl } from "../lib/decentraland/realm-resolution";
import type { AboutResponse } from "@dcl/protocol/out-ts/decentraland/bff/http_endpoints.gen";

export const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element

const engine = initEngine(canvas)

Object.assign(globalThis, { engine })

void engine.scene.debugLayer.show({ showExplorer: true, embedMode: true })

async function loadRealm(realmConnectionString: string) {
  // naively, first destroy all created scenes before loading the new realm.
  // in the future many optimization could be applied here, like only destroying
  // the scenes that will be replaced by the new realm.

  const url = (await resolveRealmBaseUrl(realmConnectionString)).replace(/\/$/, '')

  // fetch the standard /about endpoint for the realm
  const realm = await fetch(url + '/about').then(res => res.json()) as AboutResponse
  // TODO: gracefully handle errors

  // destroy all scenes, copy the loadedScenesByEntityId into an array to avoid
  // errors caused by mutations of the loadedScenesByEntityId
  for (const entityId of Array.from(loadedScenesByEntityId.keys())) {
    unloadScene(entityId)
  }

  // now that all scenes are destroyed, load the new realm
  if (realm.configurations?.scenesUrn) {
    for (const urn of realm.configurations?.scenesUrn) {
      await loadSceneContext(engine.scene, urn)

      // teleport the camera to the first scene
      if (loadedScenesByEntityId.size == 1) {
        const [first] = loadedScenesByEntityId
        engine.scene.activeCamera!.position.copyFrom(first[1].rootNode.position)
        engine.scene.activeCamera!.position.y = 2
      }
    }
  }

  return url
}

{

  const realmInput = document.getElementById('realm-input') as HTMLInputElement

  const url = new URLSearchParams(location.search)
  if (url.has('realm')) {
    realmInput.value = url.get('realm')!
  }

  // UI bindings
  async function uiChangeRealm() {
    realmInput.setAttribute('disabled', 'true')
    try {
      const url = await loadRealm(realmInput.value)
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
}
