import * as BABYLON from "@babylonjs/core";
import { Ray, Vector3 } from "@babylonjs/core";
import { RaycastHit } from "@dcl/protocol/out-ts/decentraland/sdk/components/common/raycast_hit.gen";
import { PBRaycast, RaycastQueryType } from "@dcl/protocol/out-ts/decentraland/sdk/components/raycast.gen";
import { PBRaycastResult } from "@dcl/protocol/out-ts/decentraland/sdk/components/raycast_result.gen";
import { LastWriteWinElementSetComponentDefinition } from "../../../decentraland/crdt-internal/components";
import { raycastComponent, raycastResultComponent } from "../../../decentraland/sdk-components/raycast-component";
import { SceneContext } from "../context";
import { globalCoordinatesToSceneCoordinates, sceneCoordinatesToBabylonGlobalCoordinates } from "../coordinates";
import { BabylonEntity } from "../entity";

/**
 * The processRaycasts function iterates over a copy of the pendingRaycastOperations
 * and for each it does
 * 1. It performs the final ray transformations based on the final positions of the entities
 * 2. Filters the meshes to perform the raycast
 * 3. Updates the RaycastResult component with the result of the query
 * 4. If necessary, removes the raycast from pendingRaycastOperations
 */
export function processRaycasts(scene: SceneContext) {
  const RaycastResult = scene.components[raycastResultComponent.componentId] as LastWriteWinElementSetComponentDefinition<PBRaycastResult>

  // clone the set into an array to mutate the set while iterating
  const iter = Array.from(scene.pendingRaycastOperations)
  for (const entityId of iter) {
    const raycast = scene.components[raycastComponent.componentId].get(entityId) as PBRaycast | null

    if (raycast) {
      const entity = scene.getEntityOrNull(entityId)
      if (entity && entity.appliedComponents.raycast) {
        const ray = computeRayDirection(scene, raycast, entity.appliedComponents.raycast.ray, entity)

        // get a list of all possible meshes to project this ray to
        const intersectableMeshes = Array.from(getMeshesWithMask(scene.rootNode, raycast.collisionMask ?? 0xffff_ffff))

        // then perform the actual raycast
        const results = ray.intersectsMeshes(intersectableMeshes, false)

        // and start preparing the result
        const raycastResult: PBRaycastResult = {
          direction: Vector3.Normalize(ray.direction),
          globalOrigin: globalCoordinatesToSceneCoordinates(scene, ray.origin),
          timestamp: raycast.timestamp || 0,
          hits: []
        }

        if (raycast.queryType === RaycastQueryType.RQT_HIT_FIRST && results.length) {
          raycastResult.hits = [pickingToRaycastHit(scene, pickClosest(results)!, ray)]
        } else if (raycast.queryType === RaycastQueryType.RQT_QUERY_ALL && results.length) {
          raycastResult.hits = results.map(_ => pickingToRaycastHit(scene, _, ray))
        }

        // send the result back to the scene
        RaycastResult.createOrReplace(entity.entityId, raycastResult)
      }
    }

    // lastly remove the raycast from the list if necessary
    const shouldRaycastBeDeletedFromPendingList = !raycast?.continuous
    if (shouldRaycastBeDeletedFromPendingList) {
      scene.pendingRaycastOperations.delete(entityId)
    }
  }
}

/**
 * Pick closest selects the closest point of an array. By .distance field
 */
function pickClosest<T extends { distance: number }>(elems: T[]): T | undefined {
  let closest: T | undefined = undefined

  for (let it of elems) {
    if (!closest || it.distance < closest.distance) {
      closest = it
    }
  }

  return closest
}

/**
 * Compute ray direction calculates the "global coordinates" ray to perform
 * the raycast operation.
 */
function computeRayDirection(scene: SceneContext, raycast: PBRaycast, ray: Ray, entity: BabylonEntity) {
  const originOffset = raycast.originOffset ?? Vector3.Zero()

  const globalOrigin = Vector3.TransformCoordinatesToRef(
    new Vector3(originOffset.x, originOffset.y, originOffset.z),
    entity.getWorldMatrix(),
    ray.origin
  );

  // and then calculate the global direction, relative to the
  if (!raycast.direction || raycast.direction?.$case === 'localDirection') {
    // then localDirection, is used to detect collisions in a path
    // i.e. Vector3.Forward(), it takes into consideration the rotation of
    // the entity to perform the raycast in local coordinates

    Vector3.TransformNormalToRef(
      new Vector3(
        raycast.direction?.localDirection.x ?? 0,
        raycast.direction?.localDirection.y ?? 0,
        raycast.direction?.localDirection.z ?? 1
      ),
      entity.getWorldMatrix(),
      ray.direction
    );
  } else if (raycast.direction?.$case === 'globalDirection') {
    ray.direction.set(
      raycast.direction?.globalDirection.x,
      raycast.direction?.globalDirection.y,
      raycast.direction?.globalDirection.z
    ).normalize()
  } else if (raycast.direction?.$case == 'globalTarget') {
    const sceneTarget = new Vector3(
      raycast.direction.globalTarget.x,
      raycast.direction.globalTarget.y,
      raycast.direction.globalTarget.z
    )
    const globalTarget = sceneCoordinatesToBabylonGlobalCoordinates(scene, sceneTarget)

    // scene one is to make it easy to point towards a pin-pointed element
    // in global space, like a fixed tower
    ray.direction.set(
      globalTarget.x - globalOrigin.x,
      globalTarget.y - globalOrigin.y,
      globalTarget.z - globalOrigin.z,
    ).normalize()
  } else if (raycast.direction?.$case == 'targetEntity') {
    const targetEntity = scene.getEntityOrNull(raycast.direction.targetEntity)
    const sceneTarget = targetEntity ? targetEntity.absolutePosition : Vector3.Zero()
    const globalTarget = sceneCoordinatesToBabylonGlobalCoordinates(scene, sceneTarget)

    // scene one is to make it easy to point towards a pin-pointed element
    // in global space, like a fixed tower
    ray.direction.set(
      globalTarget.x - globalOrigin.x,
      globalTarget.y - globalOrigin.y,
      globalTarget.z - globalOrigin.z,
    ).normalize()
  }

  return ray
}

function* getMeshesWithMask(entity: BabylonEntity, mask: number): Iterable<BABYLON.AbstractMesh> {
  // if (entity.meshRenderer) yield* getMeshes(entity.meshRenderer, mask)
  if (entity.appliedComponents.meshCollider) {
    const givenMask = entity.appliedComponents.meshCollider.info.collisionMask ?? 0xffffffff
    if (bitIntersects(givenMask, mask))
      yield* getMeshes(entity.appliedComponents.meshCollider!.collider, mask)
  }

  for (const child of entity.childrenEntities()) {
    yield* getMeshesWithMask(child, mask)
  }
}

function bitIntersects(a: number, b: number) {
  return (a & b) !== 0
}

/**
 * Returns an iterator of all the child meshes and the current mesh.
 */
function* getMeshes(node: BABYLON.AbstractMesh | null, mask: number): Iterable<BABYLON.AbstractMesh> {
  if (!node) return
  yield node
  yield* node.getChildMeshes()
}

/**
 * Converts a result of a raycast (PickingInfo) into a RaycastHit of the Decentraland Protocol
 */
function pickingToRaycastHit(scene: SceneContext, pickingInfo: BABYLON.PickingInfo, ray: BABYLON.Ray): RaycastHit {
  return {
    normalHit: pickingInfo.getNormal(true)!,
    direction: ray.direction,
    globalOrigin: globalCoordinatesToSceneCoordinates(scene, ray.origin),
    length: pickingInfo.distance,
    position: pickingInfo.pickedPoint!,
    entityId: getParentEntityId(pickingInfo.pickedMesh),
    meshName: pickingInfo.pickedMesh?.name
  }
}

// iterates the parents of the mesh until the a BabylonEntity is reached, it returns its .entityId
function getParentEntityId(node: BABYLON.Nullable<BABYLON.AbstractMesh>): number | undefined {
  let parent: BabylonEntity | BABYLON.Nullable<BABYLON.AbstractMesh> | null = node
  while (parent = parent?.parent as any) {
    if (parent instanceof BabylonEntity) return parent.entityId
  }
  return undefined
}

