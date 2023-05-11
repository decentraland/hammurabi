import { ComponentType } from "../crdt-internal/components";
import { PBAvatarShape } from "@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { AvatarRenderer } from "../../babylon/avatars/AvatarRenderer";

export const avatarShapeComponent = declareComponentUsingProtobufJs(PBAvatarShape, 1080, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBAvatarShape | null

  if (newValue) {
    if (!entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer = new AvatarRenderer(entity) 
      entity.appliedComponents.avatarRenderer.parent = entity
    }

    entity.appliedComponents.avatarRenderer?.setAvatarShape(newValue)
  } else {
    if (entity.appliedComponents.avatarRenderer) {
      entity.appliedComponents.avatarRenderer.parent = null
      entity.appliedComponents.avatarRenderer.dispose()
    }
  }
})
