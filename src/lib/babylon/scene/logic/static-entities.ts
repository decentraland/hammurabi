import { Vector3, Quaternion } from "@babylonjs/core";
import { transformComponent } from "../../../decentraland/sdk-components/transform-component";
import type { SceneContext } from "../scene-context";
import { globalCoordinatesToSceneCoordinates } from "../coordinates";
import { Entity } from "../../../decentraland/types";
import { engineInfoComponent } from "../../../decentraland/sdk-components/engine-info";
import { EntityUtils } from "../../../decentraland/crdt-internal/generational-index-pool";
import { playerEntityAtom } from "../../../decentraland/state";

export const StaticEntities = {
  RootEntity: 0 as Entity,
  PlayerEntity: 1 as Entity,
  CameraEntity: 2 as Entity,
  GlobalCenterOfCoordinates: 5 as Entity,
} as const

export const PLAYER_HEIGHT = 1.7
export const MAX_RESERVED_ENTITY = 512
export const AVATAR_ENTITY_RANGE: [number, number] = [128, MAX_RESERVED_ENTITY]

// this function defines if the engine should accept updates to the entity by its
// entity number
export function entityIsInRange(entity: Entity, range: [number, number]) {
  const [entityNumber, _version] = EntityUtils.fromEntityId(entity)
  return entityNumber < range[1] && entityNumber >= range[0]
}

/**
 * This function updates the static entities to be reported back to the scene once
 * per frame and when the scene asks for the initial state.
 */
export function updateStaticEntities(context: SceneContext) {
  const EngineInfo = context.components[engineInfoComponent.componentId]

  if (!EngineInfo.has(StaticEntities.RootEntity))
    EngineInfo.create(StaticEntities.RootEntity, { frameNumber: 0, tickNumber: 0, totalRuntime: 0 })

  const info = EngineInfo.getMutable(StaticEntities.RootEntity)

  info.tickNumber = context.currentTick
  info.totalRuntime = context.getElapsedTime()
  info.frameNumber = context.babylonScene.getEngine().frameId - context.startFrame

  const Transform = context.components[transformComponent.componentId]

  if (!Transform.has(StaticEntities.CameraEntity))
    Transform.create(StaticEntities.CameraEntity, { position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: StaticEntities.RootEntity })
  if (!Transform.has(StaticEntities.PlayerEntity))
    Transform.create(StaticEntities.PlayerEntity, { position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: StaticEntities.RootEntity })
  if (!Transform.has(StaticEntities.GlobalCenterOfCoordinates))
    Transform.create(StaticEntities.GlobalCenterOfCoordinates, { position: context.rootNode.position.scale(-1), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: StaticEntities.RootEntity })


  // StaticEntities.PlayerEntity
  {
    const playerTransform = Transform.getMutable(StaticEntities.PlayerEntity)

    const player = playerEntityAtom.getOrNull()

    // convert the camera position to scene-space coordinates
    playerTransform.position = globalCoordinatesToSceneCoordinates(context, player?.absolutePosition ?? Vector3.Zero())
    playerTransform.rotation = player?.absoluteRotationQuaternion ?? Quaternion.Identity()
  }

  // StaticEntities.CameraEntity
  {
    const engineCamera = context.babylonScene.activeCamera
    const cameraTransform = Transform.getMutable(StaticEntities.CameraEntity)

    engineCamera?.getWorldMatrix().decompose(
      undefined,
      cameraTransform.rotation,
      cameraTransform.position
    )

    // convert the camera position to scene-space coordinates
    cameraTransform.position = globalCoordinatesToSceneCoordinates(context, cameraTransform.position)

    cameraTransform.scale.setAll(1)
  }
}

