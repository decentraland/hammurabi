import { Entity, engine, Transform, MeshRenderer, Raycast, RaycastQueryType, Schemas, RaycastResult, MeshCollider, ColliderLayer } from "@dcl/sdk/ecs"
import { Vector3, Quaternion } from "@dcl/sdk/math"
import { registerRaycastHit } from "./raycastHits"

const TurretSegment = engine.defineComponent("TurretArticulatedSegment", {
  index: Schemas.Float,
  current: Schemas.Float
})

export function addTurretSegment(parent: Entity, index: number) {
  const segment = engine.addEntity()
  TurretSegment.create(segment, { index })
  Transform.create(segment, { parent, position: { x: 0, y: 0, z: 1 } })
  const cube = engine.addEntity()
  Transform.create(cube, { parent: segment, scale: { x: 0.5 / index, y: 0.5 / index, z: 1 }, position: { x: 0, y: 0, z: 0.5 } })
  MeshRenderer.setBox(cube)
  return segment
}

export function initRaycastTurrets(parent: Entity) {
  const floor = engine.addEntity()
  Transform.create(floor, {
    parent,
    position: { x: 8, y: 0, z: 8 },
    scale: { x: 16, y: 0.01, z: 16 },
  })
  MeshRenderer.setBox(floor)
  const collisionMask = ColliderLayer.CL_PHYSICS
  MeshCollider.setBox(floor, collisionMask)


  {
    const parentEntity = engine.addEntity()
    const parentTransform = Transform.create(parentEntity, { parent })

    parentTransform.position.x = 12
    parentTransform.position.y = 5
    parentTransform.position.z = 12

    const segment1 = addTurretSegment(parentEntity, 1)
    const segment2 = addTurretSegment(segment1, 2)
    const segment3 = addTurretSegment(segment2, 3)
    const segment4 = addTurretSegment(segment3, 4)
    const segment5 = addTurretSegment(segment4, 6)

    Raycast.create(segment5, {
      originOffset: Vector3.scale(Vector3.Forward(), 1.1),
      direction: {
        $case: 'localDirection',
        localDirection: Vector3.Forward()
      },
      continuous: true,
      maxDistance: 999,
      queryType: RaycastQueryType.RQT_HIT_FIRST
    })
  }

  {
    const parentEntity = engine.addEntity()
    const parentTransform = Transform.create(parentEntity, { parent })

    parentTransform.position.x = 8
    parentTransform.position.y = 8
    parentTransform.position.z = 8

    const segment1 = addTurretSegment(parentEntity, 1)
    const segment2 = addTurretSegment(segment1, 9)
    const segment3 = addTurretSegment(segment2, 3)
    const segment4 = addTurretSegment(segment3, 4)
    const segment5 = addTurretSegment(segment4, 4)

    Raycast.create(segment5, {
      originOffset: Vector3.scale(Vector3.Forward(), 1.1),
      direction: {
        $case: 'globalTarget',
        globalTarget: Vector3.Zero()
      },
      continuous: true,
      maxDistance: 999,
      queryType: RaycastQueryType.RQT_HIT_FIRST
    })

    let i = 0

    engine.addSystem(dt => {
      const cameraTransform = Transform.get(engine.CameraEntity)

      const globalTarget = Vector3.add(cameraTransform.position, Vector3.Down())

      i += dt
      globalTarget.x += Math.sin(i)
      globalTarget.z += Math.cos(i)

      Raycast.getMutable(segment5).direction = { $case: 'globalTarget', globalTarget }
    })
  }

  {
    const parentEntity = engine.addEntity()
    const parentTransform = Transform.create(parentEntity, { parent })

    parentTransform.position.x = 4
    parentTransform.position.y = 5
    parentTransform.position.z = 4

    const segment1 = addTurretSegment(parentEntity, 1)
    const segment2 = addTurretSegment(segment1, 3)
    const segment3 = addTurretSegment(segment2, 3)
    const segment4 = addTurretSegment(segment3, 3)
    const segment5 = addTurretSegment(segment4, 6)

    Raycast.create(segment5, {
      originOffset: Vector3.scale(Vector3.Forward(), 1.1),
      direction: {
        $case: 'globalDirection',
        globalDirection: Vector3.Down()
      },
      continuous: true,
      maxDistance: 999,
      queryType: RaycastQueryType.RQT_HIT_FIRST,
      collisionMask
    })
  }

  engine.addSystem(dt => {
    for (const [entity] of engine.getEntitiesWith(TurretSegment)) {
      const t = Transform.getMutable(entity)
      const segment = TurretSegment.getMutable(entity)
      segment.current += dt / segment.index
      t.rotation = Quaternion.fromLookAt(Vector3.Zero(), { x: Math.sin(segment.current), y: Math.sin(segment.current / 2), z: Math.sin(segment.current + 1) + 0.8 })
    }

    for (const [_entity, _turret, raycastResult] of engine.getEntitiesWith(TurretSegment, RaycastResult)) {
      if (raycastResult.hits.length)
        registerRaycastHit(raycastResult.hits[0].position!, 1)
    }
  })
}