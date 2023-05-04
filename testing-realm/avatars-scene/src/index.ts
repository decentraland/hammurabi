// export all the functions required to make the scene work
export * from '@dcl/sdk'
import { engine, PlayerIdentityData, AvatarShape } from '@dcl/sdk/ecs'

// print all the transforms of the avatars range
engine.addSystem(function rotateCube(dt) {
  // first ensure that all PlayerIdentity components have a children entity
  for (const [playerEntity, { address }] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (!AvatarShape.has(playerEntity)) {
      console.log(`Creating entity ${playerEntity.toString(16)} (${address})`)
      AvatarShape.createOrReplace(playerEntity, {
        emotes: [],
        id: address,
        wearables: [],
        bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseMale',
      })
    }
  }

  // finally ensure that all all referenced avatars have a valid playerEntity
  for (const [playerEntity] of engine.getEntitiesWith(AvatarShape)) {
    if (!PlayerIdentityData.has(playerEntity)) {
      console.log(`Deleting entity ${playerEntity.toString(16)}`)
      AvatarShape.deleteFrom(playerEntity)
    }
  }
})