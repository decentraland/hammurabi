import { engine, Transform, BillboardMode, Entity, MeshRenderer, MeshCollider, Billboard } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"
import { addTurretSegment } from "./turrets"

// This function adds billboard elements
export function initBillboardsScene(billboardParent: Entity) {
  function makeMesh(x: number, z: number, mode: BillboardMode, parent: Entity) {
    const meshEntity = engine.addEntity()

    Transform.create(meshEntity, { position: { x: x * 2 + 8, y: 1, z: z * 2 + 2 }, scale: { x: 0.5, y: 0.5, z: 1 }, parent })
    // set how the cube looks and collides
    MeshRenderer.setBox(meshEntity)
    MeshCollider.setBox(meshEntity)

    Billboard.createOrReplace(meshEntity, { billboardMode: mode })

    return meshEntity
  }

  makeMesh(-3, 0, BillboardMode.BM_NONE, billboardParent)
  makeMesh(-2, 0, BillboardMode.BM_X, billboardParent)
  makeMesh(-1, 0, BillboardMode.BM_X | BillboardMode.BM_Z, billboardParent)
  makeMesh(0, 0, BillboardMode.BM_X | BillboardMode.BM_Y, billboardParent)
  makeMesh(1, 0, BillboardMode.BM_Y, billboardParent)
  makeMesh(2, 0, BillboardMode.BM_Z | BillboardMode.BM_Y, billboardParent)
  makeMesh(3, 0, BillboardMode.BM_Z, billboardParent)
  makeMesh(4, 0, BillboardMode.BM_ALL, billboardParent)

  makeMesh(-3, 1, BillboardMode.BM_NONE, billboardParent)
  makeMesh(-2, 1, BillboardMode.BM_X, billboardParent)
  makeMesh(-1, 1, BillboardMode.BM_X | BillboardMode.BM_Z, billboardParent)
  makeMesh(0, 1, BillboardMode.BM_X | BillboardMode.BM_Y, billboardParent)
  makeMesh(1, 1, BillboardMode.BM_Y, billboardParent)
  makeMesh(2, 1, BillboardMode.BM_Z | BillboardMode.BM_Y, billboardParent)
  makeMesh(3, 1, BillboardMode.BM_Z, billboardParent)
  makeMesh(4, 1, BillboardMode.BM_ALL, billboardParent)

  makeMesh(-3, 2, BillboardMode.BM_NONE, billboardParent)
  makeMesh(-2, 2, BillboardMode.BM_X, billboardParent)
  makeMesh(-1, 2, BillboardMode.BM_X | BillboardMode.BM_Z, billboardParent)
  makeMesh(0, 2, BillboardMode.BM_X | BillboardMode.BM_Y, billboardParent)
  makeMesh(1, 2, BillboardMode.BM_Y, billboardParent)
  makeMesh(2, 2, BillboardMode.BM_Z | BillboardMode.BM_Y, billboardParent)
  makeMesh(3, 2, BillboardMode.BM_Z, billboardParent)
  makeMesh(4, 2, BillboardMode.BM_ALL, billboardParent)

  makeMesh(-3, 3, BillboardMode.BM_NONE, billboardParent)
  makeMesh(-2, 3, BillboardMode.BM_X, billboardParent)
  makeMesh(-1, 3, BillboardMode.BM_X | BillboardMode.BM_Z, billboardParent)
  makeMesh(0, 3, BillboardMode.BM_X | BillboardMode.BM_Y, billboardParent)
  makeMesh(1, 3, BillboardMode.BM_Y, billboardParent)
  makeMesh(2, 3, BillboardMode.BM_Z | BillboardMode.BM_Y, billboardParent)
  makeMesh(3, 3, BillboardMode.BM_Z, billboardParent)
  makeMesh(4, 3, BillboardMode.BM_ALL, billboardParent)

  const parentEntity = engine.addEntity()
  const parentTransform = Transform.create(parentEntity, { parent: billboardParent })

  parentTransform.position.x = 8
  parentTransform.position.y = 5
  parentTransform.position.z = 8

  const segment1 = addTurretSegment(parentEntity, 1)
  const segment2 = addTurretSegment(segment1, 1)
  const segment3 = addTurretSegment(segment2, 1)
  const segment4 = addTurretSegment(segment3, 1)
  const segment5 = addTurretSegment(segment4, 1)

  const mesh = makeMesh(0, 0, BillboardMode.BM_ALL, segment5)
  Transform.getMutable(mesh).scale = Vector3.create(2, 2, 0.1)
  Transform.getMutable(mesh).position = Vector3.create(0, 0, 1)

  const referencePlate = engine.addEntity()
  MeshRenderer.setBox(referencePlate)
  Transform.create(referencePlate, { parent: segment5, scale: Vector3.create(1, 1, 0.1), position: Vector3.create(0, 0, 1) })
}