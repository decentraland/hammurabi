import "@babylonjs/inspector"
import { initEngine } from "./lib/babylon";
import { loadSceneContext } from "./lib/babylon/scene/load";

export const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element

const engine = initEngine(canvas)

Object.assign(globalThis, { engine })

void engine.scene.debugLayer.show({ showExplorer: true, embedMode: true })

async function loadExampleScene() {
  const res = await fetch('/scene-info.json')
  const {entityId} = await res.json()
  return loadSceneContext(engine.scene, entityId, new URL('/ipfs/', document.location.toString()).toString())
}

loadExampleScene().catch(err => {
  console.error(err)
  debugger
})