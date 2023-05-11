/**
 * This whole file creates a pool of ephemeral entities.
 * The entities can be placed in global coordinates and then they are deduced in
 * size based on the provided "duration" parameter. Once the time is complete and
 * the size == 0, the entity will be reused.
 */
import { ComponentType, engine, Entity, MeshRenderer, Schemas, Transform } from "@dcl/sdk/ecs";
import { Quaternion, Vector3 } from "@dcl/sdk/math";

const releasedEntities = new Set<Entity>()

const Countdown = engine.defineComponent('raycast timer', {
  seconds: Schemas.Float,
  totalSeconds: Schemas.Float
})

export function registerRaycastHit(position: Vector3, seconds = 2) {
  let entity: Entity

  if (releasedEntities.size) {
    [entity] = releasedEntities
  } else {
    entity = engine.addEntity()
  }

  MeshRenderer.setSphere(entity)
  Transform.createOrReplace(entity, {
    parent: engine.RootEntity,
    position,
    rotation: Quaternion.Identity(),
    scale: Vector3.One()
  })
  Countdown.createOrReplace(entity, { seconds, totalSeconds: seconds })

  releasedEntities.delete(entity)

  return entity
}


engine.addSystem(function (dt) {
  const entitiesToDelete = []

  for (const [entity] of engine.getEntitiesWith(Countdown)) {
    const countdown = Countdown.getMutable(entity)
    countdown.seconds -= dt

    if (countdown.seconds < 0) {
      entitiesToDelete.push(entity)
    } else {
      const size = countdown.seconds / countdown.totalSeconds
      Vector3.copyFromFloats(
        size, size, size,
        Transform.getMutable(entity).scale,
      )
    }
  }

  for (const entity of entitiesToDelete) {
    for (const component of engine.componentsIter()) {
      if (component.componentType === ComponentType.LastWriteWinElementSet)
        component.deleteFrom(entity)
    }
    releasedEntities.add(entity)
  }
}, Infinity)