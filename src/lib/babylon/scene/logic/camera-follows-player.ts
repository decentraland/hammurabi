import { ArcRotateCamera, TransformNode, Vector3 } from "@babylonjs/core";
import { PLAYER_HEIGHT, StaticEntities } from "./static-entities";
import { CharacterController } from "../../avatars/CharacterController";
import { BabylonEntity } from "../BabylonEntity";
import { Transform, applyNewTransform, transformComponent } from "../../../decentraland/sdk-components/transform-component";

export function createCameraFollowsPlayerSystem(camera: ArcRotateCamera, playerEntity: BabylonEntity, characterController: CharacterController) {

  // this function updates the PlayerEntity position using the CharacterController.capsule's position
  function updatePlayerEntityPositionFromCapsule(playerEntity: BabylonEntity, capsule: TransformNode) {
    const pos = capsule.absolutePosition.clone()
    pos.y -= 1 // don't know why

    const t: Transform = {
      parent: StaticEntities.RootEntity,
      position: pos,
      rotation: capsule.absoluteRotationQuaternion,
      scale: Vector3.One(),
    }

    const localAvatarScene = playerEntity.context.deref()!

    localAvatarScene.components[transformComponent.componentId].createOrReplace(StaticEntities.PlayerEntity, t)
    applyNewTransform(playerEntity, t)
  }

  return {
    update() {
      updatePlayerEntityPositionFromCapsule(playerEntity, characterController.capsule)

      // IMPORTANT: This logic is truncated, there are many protocol defined factors
      // playing with the visibility of the player. Those will be implemented in a future
      // PR along with the avatar attachment components of the SDK
      const playerVisible = !characterController.inFirstPerson

      playerEntity.setEnabled(playerVisible)
      playerEntity.absolutePosition.addToRef(new Vector3(0, PLAYER_HEIGHT, 0), camera.target);
    }
  }
}