import { engine, executeTask, Material, MeshRenderer, Transform } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'

import { createCube } from './factory'
import { bounceScalingSystem, circularSystem, spawnerSystem } from './systems'

// import { setupUi } from './ui'

// export all the functions required to make the scene work
export * from '@dcl/sdk'

// Defining behavior. See `src/systems.ts` file.
engine.addSystem(circularSystem)
engine.addSystem(spawnerSystem)
engine.addSystem(bounceScalingSystem)

// Initial function executed when scene is evaluated and after systems are created
executeTask(async function () {
  // Create my main cube and color it.
  const cube = createCube(-2, 1, -2)
  Material.setPbrMaterial(cube, { albedoColor: Color4.create(1.0, 0.0, 0.42) })

  for (let x = 0.5; x < 16; x += 1) {
    for (let y = 0.5; y < 16; y += 1) {
      createCube(x, 0, y, false)
    }
  }
})

let hoverState: number = 0

engine.addSystem(function CircleHoverSystem(dt: number) {
  hoverState += Math.PI * dt * 0.5

  const entitiesWithBoxShapes = engine.getEntitiesWith(MeshRenderer, Transform)

  // iterate over the entities of the group
  for (const [entity] of entitiesWithBoxShapes) {
    const transform = Transform.getMutable(entity)

    // mutate the rotation
    transform.position.y =
      Math.cos(
        hoverState + Math.sqrt(Math.pow(transform.position.x - 8, 2) + Math.pow(transform.position.z - 8, 2)) / Math.PI
      ) *
      2 +
      2
  }
})

let renderNumber = 0
engine.addSystem(function () {
  if (renderNumber % 10 == 0) {
    // this line is purposefully a .get instead of a .getOrNull because it
    // should FAIL ig the Transform of the CameraEntity is not avaliable at this
    // moment
    const transform = Transform.get(engine.CameraEntity)
    console.log(`CameraTransform: ${JSON.stringify(transform)}`)
    renderNumber
  }
})
// setupUi()
