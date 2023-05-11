import { Scene } from "@babylonjs/core"

export type DecentralandSystem = {
  update?(): void
  lateUpdate?(): void
}

export function addSystems(scene: Scene, ...systems: DecentralandSystem[]) {
  scene.onBeforeRenderObservable.add(() => {
    systems.forEach($ => $.update && $.update())
  })
  scene.onAfterRenderObservable.add(() => {
    systems.forEach($ => $.lateUpdate && $.lateUpdate())
  })
}