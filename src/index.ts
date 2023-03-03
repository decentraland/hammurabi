import { MeshBuilder, TransformNode, Vector3 } from "@babylonjs/core";
import "@babylonjs/inspector"
import { initEngine } from "./lib/babylon";

export const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement // Get the canvas element

const engine = initEngine(canvas)

Object.assign(globalThis, { engine })

void engine.scene.debugLayer.show({ showExplorer: true, embedMode: true })

{
  // create a box and attach it to an entity
  const baseBox = MeshBuilder.CreateBox('base-box', {
    updatable: false,
  })
  baseBox.checkCollisions = true

  const entity = new TransformNode('le cube', engine.scene)
  baseBox.parent = entity
  entity.position.set(5, 1.8, 8)

  engine.scene.getEngine().onEndFrameObservable.add(() => {
    const dt = engine.scene.getEngine().getDeltaTime() / 4
    entity.rotate(Vector3.Up(), dt / 1000)
    entity.rotate(Vector3.Left(), dt / 2000)
    entity.rotate(Vector3.Forward(), dt / 1500)
  })
}