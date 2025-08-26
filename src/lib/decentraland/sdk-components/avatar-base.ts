import { ComponentType } from "../crdt-internal/components";
import { PBAvatarBase } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_base.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { BabylonEntity } from "../../babylon/scene/BabylonEntity";
import { AvatarRenderer } from "../../babylon/avatars/AvatarRenderer";

export const avatarBaseComponent = declareComponentUsingProtobufJs(PBAvatarBase, 1087, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBAvatarBase | null

  setAvatarBase(entity, newValue)
})

export function setAvatarBase(entity: BabylonEntity, data: PBAvatarBase | null) {
  if (data) {
    // Store avatar base data for use by avatar renderer
    entity.appliedComponents.avatarBase = data

    // Create or update avatar renderer
    if (!entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer = new AvatarRenderer(entity)
      entity.appliedComponents.avatarRenderer.parent = entity
    }
    
    // Update with the new base data
    entity.appliedComponents.avatarRenderer.updateAvatarBase(data)
  } else {
    if (entity.appliedComponents.avatarBase) {
      delete entity.appliedComponents.avatarBase
    }
    
    // Clear avatar renderer if no avatar base data
    if (entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer.parent = null
      entity.appliedComponents.avatarRenderer.dispose()
      delete entity.appliedComponents.avatarRenderer
    }
  }
}