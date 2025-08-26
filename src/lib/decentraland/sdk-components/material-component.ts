import { ComponentType } from "../crdt-internal/components";
import { MaterialTransparencyMode, PBMaterial } from "@dcl/protocol/out-js/decentraland/sdk/components/material.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { PBRMaterial, StandardMaterial } from "@babylonjs/core";
import { BabylonEntity, baseMaterial } from "../../babylon/scene/BabylonEntity";

export const materialComponent = declareComponentUsingProtobufJs(PBMaterial, 1017, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = component.getOrNull(entity.entityId) as PBMaterial | null

  const newMaterialType = newValue?.material?.$case

  let currentMaterial = entity.appliedComponents?.material?.material

  const currentMaterialType =
    !currentMaterial
      ? 'undefined'
      : currentMaterial instanceof PBRMaterial
        ? 'pbr'
        : 'unlit'

  const materialNeedsRegeneration = currentMaterialType !== newMaterialType

  if (materialNeedsRegeneration) {
    currentMaterial?.dispose()
    currentMaterial = undefined
    switch (newMaterialType) {
      case 'pbr':
        currentMaterial = new PBRMaterial('sdk material', entity.getScene())
        break
      case 'unlit':
        currentMaterial = new StandardMaterial('sdk material', entity.getScene())
        break
    }
  }

  if (currentMaterial instanceof PBRMaterial && newValue?.material?.$case === 'pbr') {
    const { pbr } = newValue.material

    currentMaterial.atomicMaterialsUpdate(m => {
      if (pbr.albedoColor) {
        m.albedoColor.set(pbr.albedoColor.r, pbr.albedoColor.g, pbr.albedoColor.b) // pbr.albedoColor.a?
        m.alpha = pbr.albedoColor.a
      } else {
        m.albedoColor.set(1, 1, 1) // pbr.albedoColor.a?
        m.alpha = 1
      }

      pbr.emissiveColor && m.emissiveColor.set(pbr.emissiveColor.r, pbr.emissiveColor.g, pbr.emissiveColor.b)
      pbr.reflectivityColor && m.reflectivityColor.set(pbr.reflectivityColor.r, pbr.reflectivityColor.g, pbr.reflectivityColor.b)


      if (pbr.transparencyMode === MaterialTransparencyMode.MTM_ALPHA_BLEND) {
        m.transparencyMode = 2
      } else if (pbr.transparencyMode === MaterialTransparencyMode.MTM_AUTO) {
        m.transparencyMode = 1
      } else if (pbr.transparencyMode === MaterialTransparencyMode.MTM_OPAQUE) {
        m.transparencyMode = 0
      } else if (pbr.transparencyMode === MaterialTransparencyMode.MTM_ALPHA_TEST_AND_ALPHA_BLEND) {
        m.transparencyMode = 3
      }

      m.metallic = pbr.metallic ?? 0.5
      m.roughness = pbr.roughness ?? 0.5
      // m.glossiness = pbr.glossiness ?? 0.5

      m.specularIntensity = pbr.specularIntensity ?? 1
      m.emissiveIntensity = pbr.emissiveIntensity ?? 2
      m.directIntensity = pbr.directIntensity ?? 1
      m.alphaCutOff = pbr.alphaTest ?? 0.5
    })
  } else if (currentMaterial instanceof StandardMaterial && newValue?.material?.$case === 'unlit') {
    const { unlit } = newValue.material

    currentMaterial.atomicMaterialsUpdate(m => {
      m.alphaCutOff = unlit.alphaTest ?? 0.5
      unlit.diffuseColor && m.diffuseColor.set(unlit.diffuseColor.r, unlit.diffuseColor.g, unlit.diffuseColor.b) // unlit.albedoColor.a?
    })
  }

  if (newValue) {
    entity.appliedComponents.material = {
      value: newValue,
      material: currentMaterial!
    }
  } else {
    delete entity.appliedComponents.material
  }

  setMeshRendererMaterial(entity)
})


export function setMeshRendererMaterial(entity: BabylonEntity) {
  const material = entity.appliedComponents.material?.material ?? baseMaterial(entity.getScene())

  const mesh = entity.appliedComponents.meshRenderer?.mesh

  if (mesh) {
    mesh.material = material
  }
}