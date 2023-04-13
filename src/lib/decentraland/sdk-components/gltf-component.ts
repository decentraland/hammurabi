import * as BABYLON from '@babylonjs/core'
import { PBGltfContainer } from "@dcl/protocol/out-ts/decentraland/sdk/components/gltf_container.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { ComponentType } from '../crdt-internal/components';
import { BabylonEntity } from '../../babylon/scene/entity';
import { updatePointerEventsMeshProperties } from './pointer-events';

export const gltfContainerComponent = declareComponentUsingProtobufJs(PBGltfContainer, 1041, (entity, component) => {
  if (component.componentType !== ComponentType.LastWriteWinElementSet) return

  const newValue = component.get(entity.entityId) as PBGltfContainer | null
  const oldValue = entity.appliedComponents.gltfContainer
  if (newValue && newValue.src !== oldValue?.value?.src && newValue.src) {
    const newGltfContainerValue = entity.appliedComponents.gltfContainer = {
      value: newValue,
      gltfContainer: oldValue?.gltfContainer || null,
      instancedEntries: oldValue?.instancedEntries || null
    }

    // for simplicity of the example, we will remove the Gltf on every update.
    const context = entity.context.deref()

    if (!context) return

    const newSrc = newValue.src
    // this procedure loads a GLTF into a babylonEntity. the model loading will happen in parallel by another
    // procedure. once the model becomes available (downloaded + loaded) this method will create
    // an instance or copy of the required meshes/bodies/bones and attach them to the entity
    // if the "src" property didn't change
    context.assetManager.getContainerFuture(newValue.src).then((assetContainer) => {
      // check if we need to update the gltf, this may be false due to async nature of the loader
      // in that case we simply ignore the result
      const isCurrentValueUpdated = newSrc === entity.appliedComponents.gltfContainer?.value.src
      if (isCurrentValueUpdated) {
        // remove the previous gltf
        removeCurrentGltf(entity)

        // and attach the new one
        newGltfContainerValue.instancedEntries = instantiateAassetContainer(assetContainer, entity)
      }
    })
  } else if (!newValue) {
    entity.appliedComponents.gltfContainer = undefined
    removeCurrentGltf(entity)
  }
})

function removeCurrentGltf(entity: BabylonEntity) {
  if (entity.appliedComponents.gltfContainer?.instancedEntries) {
    entity.appliedComponents.gltfContainer.instancedEntries.dispose()
    entity.appliedComponents.gltfContainer.instancedEntries = null
  }
  if (entity.appliedComponents.gltfContainer?.gltfContainer) {
    entity.appliedComponents.gltfContainer.gltfContainer.setEnabled(false)
    entity.appliedComponents.gltfContainer.gltfContainer.parent = null
    entity.appliedComponents.gltfContainer.gltfContainer.dispose(true, true)
    entity.appliedComponents.gltfContainer.gltfContainer = null
  }
}

export function instantiateAassetContainer(assetContainer: BABYLON.AssetContainer, entity: BabylonEntity): BABYLON.InstantiatedEntries {
  const instances = assetContainer.instantiateModelsToScene(name => name, false)

  for (let node of instances.rootNodes) {
    // reparent the root node inside the entity
    node.parent = entity

    // update pointer events
    updatePointerEventsMeshProperties(entity, node)

    node.getChildMeshes(false).forEach(mesh => {
      // this override makes all meshes not renderable if the rootNode is not enabled.
      // it cascades the effect of the culling of the rootNode down to each mesh to lighten the CPU work
      // of calculating every bounding box
      Object.defineProperty(mesh, 'isBlocked', {
        enumerable: true,
        configurable: true,
        get() {
          return !entity.context.deref()?.rootNode.isEnabled || (mesh._masterMesh !== null && mesh._masterMesh !== undefined)
        },
      })
    })
  }

  for (let ag of instances.animationGroups) {
    ag.stop()
    for (let animatable of ag.animatables) {
      animatable.weight = 0
    }
  }

  return instances
}

function disposeDelegate($: { dispose: Function }) {
  $.dispose()
}

function disposeNodeDelegate($: BABYLON.Node | null) {
  if (!$) return
  $.setEnabled(false)
  $.parent = null
  $.dispose(false)
}

function disposeSkeleton($: BABYLON.Skeleton) {
  $.dispose()
  $.bones.forEach(($) => {
    $.parent = null
    $.dispose()
  })
}

function disposeAnimatable($: BABYLON.Animatable | null) {
  if (!$) return
  $.disposeOnEnd = true
  $.loopAnimation = false
  $.stop()
  $._animate(0)
}

export function disposeAnimationGroups($: BABYLON.AnimationGroup) {
  $.animatables.forEach(disposeAnimatable)

  $.targetedAnimations.forEach(($) => {
    // disposeAnimatable(scene.getAnimatableByTarget($.target))
  })

  $.dispose()
}

export function cleanupAssetContainer($: BABYLON.AssetContainer) {
  if ($) {
    $.removeAllFromScene()
    $.transformNodes && $.transformNodes.forEach(disposeNodeDelegate)
    $.rootNodes && $.rootNodes.forEach(disposeNodeDelegate)
    $.meshes && $.meshes.forEach(disposeNodeDelegate)
    // Textures disposals are handled by monkeyLoader.ts
    // NOTE: $.textures && $.textures.forEach(disposeDelegate)
    $.animationGroups && $.animationGroups.forEach(disposeAnimationGroups)
    $.multiMaterials && $.multiMaterials.forEach(disposeDelegate)
    $.sounds && $.sounds.forEach(disposeDelegate)
    $.skeletons && $.skeletons.forEach(disposeSkeleton)
    $.materials && $.materials.forEach(disposeDelegate)
    $.lights && $.lights.forEach(disposeDelegate)
  }
}
