import { Scene } from "@babylonjs/core"
import { SceneContext } from "../scene-context"
import { StaticEntities } from "./static-entities"
import { avatarShapeComponent, setAvatarRenderer } from "../../../decentraland/sdk-components/avatar-shape"
import { PBAvatarShape } from "@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen"
import { Atom } from "../../../misc/atom"
import { Avatar } from "@dcl/schemas"

// this system internally creates a SceneContext to host the playerEntity
// IMPORTANT: this behavior is not final, will be revisited while implementing AvatarAttachment component
export async function createLocalAvatarSceneSystem(scene: Scene, currentAvatar: Atom<Avatar>) {
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
    true
  )

  await localAvatarScene.initAsyncJobs()
  const playerEntity = localAvatarScene.getOrCreateEntity(StaticEntities.PlayerEntity)

  function setAvatarShape(value: PBAvatarShape) {
    localAvatarScene.components[avatarShapeComponent.componentId].createOrReplace(StaticEntities.PlayerEntity, value)
    setAvatarRenderer(playerEntity, value)
  }


  setAvatarShape({
    id: "Guest (loading)",
    name: "Guest (loading)",
    wearables: [
      "urn:decentraland:off-chain:base-avatars:sneakers",
      "urn:decentraland:off-chain:base-avatars:eyes_00",
      "urn:decentraland:off-chain:base-avatars:eyebrows_00",
      "urn:decentraland:off-chain:base-avatars:mouth_00",
      "urn:decentraland:off-chain:base-avatars:beard",
      "urn:decentraland:off-chain:base-avatars:triple_ring",
      "urn:decentraland:off-chain:base-avatars:basketball_shorts",
    ],
    emotes: [],
    bodyShape: "urn:decentraland:off-chain:base-avatars:BaseMale",
    eyeColor: {
      r: 1.0,
      g: 0.0,
      b: 0.0,
    },
    hairColor: {
      r: 0.0,
      g: 0.0,
      b: 1.0,
    },
    skinColor: {
      r: 0.0,
      g: 1.0,
      b: 0.0,
    },
  })

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

  currentAvatar.pipe(setAvatarShapeFromAvatar)

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