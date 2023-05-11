import { Scene } from "@babylonjs/core"

export type DecentralandSystem = {
  update?(): void
  lateUpdate?(): void
}

export function addSystems(scene: Scene, ...systems: DecentralandSystem[]) {
  scene.onBeforeAnimationsObservable.add(() => {
    systems.forEach($ => $.update && $.update())
  })
  scene.onAfterDrawPhaseObservable.add(() => {
    systems.forEach($ => $.lateUpdate && $.lateUpdate())
  })
}