import { Scene } from "@babylonjs/core"
import { SceneContext } from "../scene-context"
import { StaticEntities } from "./static-entities"
import { avatarShapeComponent, setAvatarRenderer } from "../../../decentraland/sdk-components/avatar-shape"
import { PBAvatarShape } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_shape.gen"
import { Atom } from "../../../misc/atom"
import { Avatar } from "@dcl/schemas"

// this system internally creates a SceneContext to host the playerEntity
// IMPORTANT: this behavior is not final, will be revisited while implementing AvatarAttachment component
export async function createLocalAvatarSceneSystem(scene: Scene, currentAvatar: Avatar) {
  const localAvatarScene = new SceneContext(
    scene,
    {
      urn: 'localAvatarScene',
      baseUrl: "https://peer.decentraland.org/content/contents",
      entity: {
        content: [],
        metadata: { main: "injected", scene: { base: "0,0", parcels: [] } },
        type: "scene",
      },
    },
    true,
    'local-avatar'
  )

  await localAvatarScene.initAsyncJobs()
  const playerEntity = localAvatarScene.getOrCreateEntity(StaticEntities.PlayerEntity)

  function setAvatarShape(value: PBAvatarShape) {
    localAvatarScene.components[avatarShapeComponent.componentId].createOrReplace(StaticEntities.PlayerEntity, value)
    // Skip setAvatarRenderer in headless mode - requires canvas/GUI textures
  }

  function setAvatarShapeFromAvatar(av: Avatar) {
    setAvatarShape({
      id: av.ethAddress,
      name: av.name,
      wearables: av.avatar.wearables,
      emotes: av.avatar.emotes?.map($ => $.urn) ?? [],
      bodyShape: av.avatar.bodyShape ?? "urn:decentraland:off-chain:base-avatars:BaseMale",
      eyeColor: av.avatar.eyes.color,
      hairColor: av.avatar.hair.color,
      skinColor: av.avatar.skin.color
    })
  }
  setAvatarShapeFromAvatar(currentAvatar)

  return {
    playerEntity,
    update() {
      localAvatarScene.update(() => true)
    },
    lateUpdate() {
      localAvatarScene.lateUpdate()
    },
    setAvatarShape
  }
}