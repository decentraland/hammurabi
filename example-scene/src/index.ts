import { Billboard, BillboardMode, engine, Entity, executeTask, Material, MeshCollider, MeshRenderer, Transform } from '@dcl/sdk/ecs'
import { Color4, Matrix, Quaternion, Vector3 } from '@dcl/sdk/math'

import { createCube } from './factory'
import { bounceScalingSystem, circularSystem, RotatorTag, spawnerSystem } from './systems'

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

  for (let x = 0.5; x < 16; x += 1) {
    for (let y = 0.5; y < 16; y += 1) {
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


// This function adds billboard elements
executeTask(async function () {
  const billboardParent = engine.addEntity()
  Transform.create(billboardParent, {})

  function makeMesh(x: number, z: number, mode: BillboardMode, parent?: Entity) {
    const meshEntity = engine.addEntity()

    Transform.create(meshEntity, { position: { x: x * 2, y: 1, z: z * 2 }, scale: { x: 1, y: 1, z: 0.5 }, parent: parent || billboardParent })
    // set how the cube looks and collides
    MeshRenderer.setBox(meshEntity)
    MeshCollider.setBox(meshEntity)

    Billboard.createOrReplace(meshEntity, { billboardMode: mode })

    return meshEntity
  }

  makeMesh(-2, 0, BillboardMode.BM_NONE)
  makeMesh(-1, 0, BillboardMode.BM_X)
  makeMesh(0, 0, BillboardMode.BM_Y)
  makeMesh(1, 0, BillboardMode.BM_Z)
  makeMesh(2, 0, BillboardMode.BM_ALL)

  const ref1 = makeMesh(-2, 2, BillboardMode.BM_NONE)
  const ref2 = makeMesh(-1, 2, BillboardMode.BM_NONE)
  const ref3 = makeMesh(0, 2, BillboardMode.BM_NONE)
  const ref4 = makeMesh(1, 2, BillboardMode.BM_NONE)
  const ref5 = makeMesh(2, 2, BillboardMode.BM_NONE)

  const container = engine.addEntity()
  Transform.create(container, { parent: billboardParent })

  makeMesh(-2, 0, BillboardMode.BM_NONE, container)
  makeMesh(-1, 0, BillboardMode.BM_X, container)
  makeMesh(0, 0, BillboardMode.BM_Y, container)
  makeMesh(1, 0, BillboardMode.BM_Z, container)
  makeMesh(2, 0, BillboardMode.BM_ALL, container)

  let a = 0;
  engine.addSystem(function (dt) {

    const cameraPosition = Transform.get(engine.CameraEntity)

    const diff2 = Vector3.subtract(Transform.getMutable(ref2).position, cameraPosition.position)
    const diff3 = Vector3.subtract(Transform.getMutable(ref3).position, cameraPosition.position)
    const diff4 = Vector3.subtract(Transform.getMutable(ref4).position, cameraPosition.position)

    Transform.getMutable(ref2).rotation = Quaternion.fromEulerDegrees(Math.atan2(-diff2.y, diff2.z), 0, 0)
    Transform.getMutable(ref3).rotation = Quaternion.fromEulerDegrees(0, Math.atan2(diff3.x, diff3.z), 0)
    Transform.getMutable(ref4).rotation = Quaternion.fromEulerDegrees(0, 0, Math.atan2(diff4.y, diff4.x))


    // this step should have the same result as BM_ALL and it is described in ADR-198
    const matrix = Matrix.Identity()
    Matrix.fromQuaternionToRef(cameraPosition.rotation, matrix)
    const invMatrix = Matrix.invert(matrix)
    Quaternion.fromRotationMatrixToRef(invMatrix, Transform.getMutable(ref5).rotation)

    Transform.getMutable(container).position.z = 4 * Math.cos(a);

    a += dt;
  })
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
