// export all the functions required to make the scene work
export * from '@dcl/sdk'
import { engine, PlayerIdentityData, AvatarShape, LastWriteWinElementSetComponentDefinition, Entity, AvatarEquippedData, AvatarCustomization } from '@dcl/sdk/ecs'

// print all the transforms of the avatars range
engine.addSystem(function rotateCube(dt) {
  // first ensure that all PlayerIdentity components have a children entity
  for (const [playerEntity, { address }] of engine.getEntitiesWith(PlayerIdentityData)) {

    if (!AvatarShape.has(playerEntity)) {
      console.log(`Creating entity ${playerEntity.toString(16)} (${address})`)
    }

    const equipData = AvatarEquippedData.getMutableOrNull(playerEntity)
    const customizations = AvatarCustomization.getMutableOrNull(playerEntity)

    replaceComponentValueIfChanged(AvatarShape, playerEntity, {
      emotes: equipData?.emotes ?? [],
      id: address,
      wearables: equipData?.urns ?? [],
      bodyShape: customizations?.bodyShapeUrn,
      eyeColor: customizations?.eyesColor,
      skinColor: customizations?.skinColor,
      hairColor: customizations?.hairColor,
      name: address
    })
  }

  // finally ensure that all all referenced avatars have a valid playerEntity
  for (const [playerEntity] of engine.getEntitiesWith(AvatarShape)) {
    if (!PlayerIdentityData.has(playerEntity)) {
      console.log(`Deleting entity ${playerEntity.toString(16)}`)
      AvatarShape.deleteFrom(playerEntity)
    }
  }
})

function replaceComponentValueIfChanged<T>(component: LastWriteWinElementSetComponentDefinition<T>, entity: Entity, value: T) {
  const currentValue = component.getOrNull(entity)

  // I'll let the history judge me for this
  if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
    console.log(`Changing ${component.componentName} ${entity.toString(16)} to`, value)
    component.createOrReplace(entity, value)
  }
}