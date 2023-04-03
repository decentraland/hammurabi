import { engine, executeTask, Material, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { initBillboardsScene } from './billboards'
import { initCameraRotation } from './cameraRotation'

import { createCube } from './factory'
import { bounceScalingSystem, circularSystem, RotatorTag, spawnerSystem } from './systems'
import { initRaycastTurrets } from './turrets'

// import { setupUi } from './ui'

// export all the functions required to make the scene work
export * from '@dcl/sdk'

const BouncerComponent = engine.defineComponent("Bouncer", {})

// Defining behavior. See `src/systems.ts` file.
engine.addSystem(circularSystem)
engine.addSystem(spawnerSystem)
engine.addSystem(bounceScalingSystem)

// This function adds some cubes and makes them mimic a wave
executeTask(async function () {
  // Create my main cube and color it.
  const cube = createCube(-2, 1, -2)
  Material.setPbrMaterial(cube, { albedoColor: Color4.create(1.0, 0.0, 0.42) })
  RotatorTag.create(cube)

  for (let x = 0.5; x < 4; x += 1) {
    for (let y = 0.5; y < 4; y += 1) {
      const cube = createCube(x + 16, 0, y + 16, false)
      BouncerComponent.createOrReplace(cube)
    }
  }

  let hoverState: number = 0

  engine.addSystem(function BouncerSystem(dt: number) {
    hoverState += Math.PI * dt * 0.5

    // iterate over the entities of the group
    for (const [entity] of engine.getEntitiesWith(Transform, BouncerComponent)) {
      const transform = Transform.getMutable(entity)

      // mutate the rotation
      transform.position.y =
        Math.cos(hoverState + Math.sqrt(Math.pow(transform.position.x - 8, 2) + Math.pow(transform.position.z - 8, 2)) / Math.PI) * 2 + 2
    }
  })
})

const turretsParent = engine.addEntity()
Transform.create(turretsParent, {
  position: { x: 0, y: 0, z: -16 }
})
initRaycastTurrets(turretsParent)

const billboardParent = engine.addEntity()
Transform.create(billboardParent, {
  position: { x: -16, y: 0, z: -16 }
})
initBillboardsScene(billboardParent)

const cameraRotationParent = engine.addEntity()
Transform.create(cameraRotationParent, {
  position: { x: -32, y: 0, z: -16 }
})
initCameraRotation(cameraRotationParent)
// setupUi()
