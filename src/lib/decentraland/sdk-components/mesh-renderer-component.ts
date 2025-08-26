import * as BABYLON from '@babylonjs/core'
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBMeshRenderer } from "@dcl/protocol/out-js/decentraland/sdk/components/mesh_renderer.gen";
import { ComponentType } from "../crdt-internal/components";
import { memoize } from "../../misc/memoize";
import { baseMaterial } from '../../babylon/scene/BabylonEntity';
import { setMeshRendererMaterial } from './material-component';

const baseBox = memoize((scene: BABYLON.Scene) => {
  const ret = BABYLON.MeshBuilder.CreateBox(
    'base-box',
    {
      updatable: false
    },
    scene
  )
  ret.material = baseMaterial(scene)
  ret.setEnabled(false)
  return ret
})

const baseSphere = memoize((scene: BABYLON.Scene) => {
  const ret = BABYLON.MeshBuilder.CreateSphere(
    'base-sphere',
    {
      updatable: false
    },
    scene
  )
  ret.material = baseMaterial(scene)
  ret.setEnabled(false)
  return ret
})

export const planeMaterial = memoize((scene: BABYLON.Scene) => {
  const material = new BABYLON.StandardMaterial(
    'plane-material',
    scene
  )
  material.specularColor.set(0, 0, 0)
  material.specularPower = 0

  material.diffuseTexture = new BABYLON.Texture('images/UV_checker_Map_byValle.jpg')

  return material
})

// TODO: this component is a stub that will be replaced by the real implementation later in a dedicated PR
export const meshRendererComponent = declareComponentUsingProtobufJs(PBMeshRenderer, 1018, (entity, component) => {
  // this function is called when we receive the component and a change needs to be applied to the entity
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  // create a box and attach it to an entity

  if (entity.appliedComponents.meshRenderer?.mesh) {
    entity.appliedComponents.meshRenderer.mesh.parent = null
    entity.appliedComponents.meshRenderer.mesh.dispose()
  }

  const info = component.get(entity.entityId)

  if (info) {
    let mesh: BABYLON.AbstractMesh | null = null

    if (info.mesh?.$case === 'box') {
      mesh = baseBox(entity.getScene()).clone()
      mesh.parent = entity
      mesh.setEnabled(true)
    } else if (info.mesh?.$case === 'sphere') {
      mesh = baseSphere(entity.getScene()).clone()
      mesh.parent = entity
      mesh.setEnabled(true)
    } else if (info.mesh?.$case === 'plane') {
      mesh = BABYLON.MeshBuilder.CreatePlane(
        'plane-shape',
        {
          width: 1,
          height: 1,
          sideOrientation: 2,
          updatable: true
        },
        entity.getScene()
      )
      mesh.parent = entity
      mesh.setEnabled(true)

      const uvs = info.mesh.plane.uvs
      if (uvs && uvs.length) {
        mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, uvs)
      } else {
        mesh.updateVerticesData(BABYLON.VertexBuffer.UVKind, [
          // backside
          0, 0, 1, 0,
          1, 1, 0, 1,
          // front side
          0, 0, 1, 0,
          1, 1, 0, 1,
        ])
      }

      mesh.material = planeMaterial(entity.getScene())
    }

    entity.appliedComponents.meshRenderer = {
      mesh,
      info
    }

    setMeshRendererMaterial(entity)
  }
})
