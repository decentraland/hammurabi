import * as BABYLON from '@babylonjs/core'
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBMeshRenderer } from "@dcl/protocol/out-ts/decentraland/sdk/components/mesh_renderer.gen";
import { ComponentType } from "../crdt-internal/components";
import { memoize } from "../../misc/memoize";

const baseBox = memoize((scene: BABYLON.Scene) => {
  const ret = BABYLON.MeshBuilder.CreateBox(
    'base-box',
    {
      updatable: false
    },
    scene
  )
  const material = new BABYLON.StandardMaterial(
    'base-box',
    scene
  )
  material.diffuseTexture = new BABYLON.Texture('images/UV_checker_Map_byValle.jpg')
  ret.material = material
  ret.setEnabled(false)
  return ret
})

// TODO: this component is a stub that will be replaced by the real implementation later in a dedicated PR
export const meshRendererComponent = declareComponentUsingProtobufJs(PBMeshRenderer, 1018, (entity, component) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // create a box and attach it to an entity

  if (entity.appliedComponents.meshRenderer) {
    entity.appliedComponents.meshRenderer.mesh?.dispose()
  }

  const info = component.get(entity.entityId)

  if (info) {
    const mesh = baseBox(entity.getScene()).createInstance("instance")
    mesh.parent = entity
    mesh.setEnabled(true)

    entity.appliedComponents.meshRenderer = {
      mesh,
      info
    }
  }
})
