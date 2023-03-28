import { Entity, engine, Transform, executeTask, MeshRenderer, RaycastResult, Raycast, RaycastQueryType, Billboard, BillboardMode } from "@dcl/sdk/ecs"
import { Matrix, Quaternion, Vector3 } from "@dcl/sdk/math"
import { createAxes } from "./axisGenerator"

export function initCameraRotation(parent: Entity) {
  let renderNumber = 0

  executeTask(async () => {
    // this line is purposefully a .get instead of a .getOrNull because it
    // should FAIL ig the Transform of the CameraEntity is not avaliable at this
    // moment, consider it an assertion
    Transform.get(engine.CameraEntity)
  })

  // this entity will copy the rotation of the camera
  const rotationCopy = engine.addEntity()
  Transform.create(rotationCopy, { parent, position: Vector3.create(6, 1, 8), scale: Vector3.create(0.5, 0.5, 0.5) })
  MeshRenderer.setBox(rotationCopy)
  const axes1 = createAxes()
  Transform.create(axes1.container, { parent: rotationCopy, scale: Vector3.create(2, 2, 2) })

  // this entity will have a renderer-space billboard
  const billboard = engine.addEntity()
  Transform.create(billboard, { parent, position: Vector3.create(8, 1, 8), scale: Vector3.create(0.5, 0.5, 0.5) })
  MeshRenderer.setBox(billboard)
  Billboard.create(billboard, { billboardMode: BillboardMode.BM_ALL })
  const axes2 = createAxes()
  Transform.create(axes2.container, { parent: billboard, scale: Vector3.create(2, 2, 2) })

  // this entity will have a user-space billboard
  const userCodeBillboard = engine.addEntity()
  Transform.create(userCodeBillboard, { parent, position: Vector3.create(10, 1, 8), scale: Vector3.create(0.5, 0.5, 0.5) })
  MeshRenderer.setBox(userCodeBillboard)
  Raycast.create(userCodeBillboard, {
    continuous: true,
    maxDistance: 32,
    queryType: RaycastQueryType.RQT_HIT_FIRST,
    direction: {
      $case: 'globalDirection',
      globalDirection: Vector3.Down()
    }
  })
  const axes3 = createAxes()
  Transform.create(axes3.container, { parent: userCodeBillboard, scale: Vector3.create(2, 2, 2) })

  let i = 0

  engine.addSystem(function (dt) {
    i += dt * 10

    Transform.getMutable(billboard).rotation = Quaternion.fromEulerDegrees(0, i, 0)

    // this line is purposefully a .get instead of a .getOrNull because it
    // should FAIL ig the Transform of the CameraEntity is not avaliable at this
    // moment
    const transform = Transform.get(engine.CameraEntity)

    if (renderNumber < 10) {
      // we will print the camera transform for ten frames only for testing purposes
      console.log(`CameraTransform: ${JSON.stringify(transform)}`)
    }

    Transform.getMutable(rotationCopy).rotation = transform.rotation
    renderNumber++
  })


  engine.addSystem(function () {
    const cameraTransform = Transform.get(engine.CameraEntity)
    const userCodeBillboardTransform = Transform.getMutable(userCodeBillboard)

    // this step should have the same result as BM_ALL and it is described in ADR-198
    const raycastResult = RaycastResult.getOrNull(userCodeBillboard)
    if (raycastResult) {
      // the lookAt matrix points the forward ray from=target to=origin. for that reason,
      // we create a matrix=lookAt(from=entity,to=camera), and then apply the inverted rotation 
      // to the entity to get the final billboard result
      // https://www.scratchapixel.com/lessons/mathematics-physics-for-computer-graphics/lookat-function/framing-lookat-function.html
      const matrix = Matrix.LookAtLH(cameraTransform.position, raycastResult.globalOrigin!, Vector3.Up())
      Quaternion.fromRotationMatrixToRef(Matrix.invert(matrix), userCodeBillboardTransform.rotation)
    }
  })
}