import { ComponentType } from "../crdt-internal/components";
import { PBAvatarShape } from "@dcl/protocol/out-ts/decentraland/sdk/components/avatar_shape.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { Scene, MeshBuilder, StandardMaterial, Texture } from "@babylonjs/core";
import { memoize } from "../../misc/memoize";

const capsule = memoize((scene: Scene) => {
  const ret = MeshBuilder.CreateCapsule(
    'base-capsule',
    {
      updatable: false
    },
    scene
  )
  const material = new StandardMaterial(
    'base-box',
    scene
  )
  material.diffuseTexture = new Texture('images/UV_checker_Map_byValle.jpg')
  ret.material = material
  ret.setEnabled(false)
  return ret
})


export const avatarShapeComponent = declareComponentUsingProtobufJs(PBAvatarShape, 1080, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // the billboard of the ROOT entity 0 cannot be changed by a CRDT message
  if (entity.entityId === 0) return

  const newValue = component.getOrNull(entity.entityId) as PBAvatarShape | null

  if (newValue) {
    if (!entity.appliedComponents.avatarShape) {
      entity.appliedComponents.avatarShape = {}
    }
    if (!entity.appliedComponents.avatarShape?.capsule) {
      const mesh = capsule(entity.getScene()).createInstance("capsule")
      mesh.parent = entity
      mesh.setEnabled(true)
      entity.appliedComponents.avatarShape.capsule = mesh
    }
  } else {
    if (entity.appliedComponents.avatarShape?.capsule) {
      entity.appliedComponents.avatarShape.capsule.parent = null
      entity.appliedComponents.avatarShape.capsule.dispose()
    }
  }
})
