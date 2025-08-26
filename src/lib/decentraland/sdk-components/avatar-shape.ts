import { ComponentType } from "../crdt-internal/components";
import { PBAvatarShape } from "@dcl/protocol/out-js/decentraland/sdk/components/avatar_shape.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { AvatarRenderer } from "../../babylon/avatars/AvatarRenderer";
import { BabylonEntity } from "../../babylon/scene/BabylonEntity";

export const avatarShapeComponent = declareComponentUsingProtobufJs(PBAvatarShape, 1080, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBAvatarShape | null

  setAvatarRenderer(entity, newValue)
})

export function setAvatarRenderer(entity: BabylonEntity, data: PBAvatarShape | null) {
  if (data) {
    if (entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer.parent = null
      entity.appliedComponents.avatarRenderer.dispose()
    }

    entity.appliedComponents.avatarRenderer = new AvatarRenderer(entity)
    entity.appliedComponents.avatarRenderer.parent = entity
    entity.appliedComponents.avatarRenderer.setAvatarShape(data)
  } else {
    if (entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer.parent = null
      entity.appliedComponents.avatarRenderer.dispose()
    }
  }
}