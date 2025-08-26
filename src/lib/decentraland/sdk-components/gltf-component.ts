import * as BABYLON from '@babylonjs/core'
import { PBGltfContainer } from "@dcl/protocol/out-js/decentraland/sdk/components/gltf_container.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { ComponentType } from '../crdt-internal/components';
import { BabylonEntity } from '../../babylon/scene/BabylonEntity';
import { applyAnimations } from '../../babylon/scene/logic/apply-animations';
import { gltfContainerLoadingStateComponent } from './gltf-loading-state';
import { LoadingState } from '@dcl/protocol/out-js/decentraland/sdk/components/common/loading_state.gen';
import { setColliderMask } from '../../babylon/scene/logic/colliders';
import { ColliderLayer } from '@dcl/protocol/out-js/decentraland/sdk/components/mesh_collider.gen';
import { instantiateAssetContainer } from '../../babylon/scene/AssetManager';

const DEFAULT_VISIBLE_COLLIDER_LAYERS = 0
const DEFAULT_INVISIBLE_COLLIDER_LAYERS = ColliderLayer.CL_PHYSICS | ColliderLayer.CL_POINTER

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

    const context = entity.context.deref()
    if (!context) return

    const newSrc = newValue.src

    // inform the component is loading
    const loadingStateComponent = context.components[gltfContainerLoadingStateComponent.componentId]
    loadingStateComponent.createOrReplace(entity.entityId, {
      currentState: LoadingState.LOADING
    })

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
        const instanced = newGltfContainerValue.instancedEntries = instantiateAssetContainer(assetContainer, entity, entity)

        // setup colliders
        instanced.rootNodes.forEach(root => {
          for (const mesh of root.getChildMeshes(false)) {
            if (mesh.name.endsWith('_collider')) {
              setColliderMask(mesh, newValue.invisibleMeshesCollisionMask ?? DEFAULT_INVISIBLE_COLLIDER_LAYERS)
            } else {
              setColliderMask(mesh, newValue.invisibleMeshesCollisionMask ?? DEFAULT_VISIBLE_COLLIDER_LAYERS)
            }
          }
        })

        // apply animations if needed
        applyAnimations(entity)

        // inform the component loaded
        loadingStateComponent.createOrReplace(entity.entityId, {
          currentState: LoadingState.FINISHED
        })
      }
    }).catch(() => {
      const isCurrentValueUpdated = newSrc === entity.appliedComponents.gltfContainer?.value.src

      if (isCurrentValueUpdated) {
        // inform the component is failed loading
        loadingStateComponent.createOrReplace(entity.entityId, {
          currentState: LoadingState.FINISHED_WITH_ERROR
        })
      }
    })
  } else if (newValue) {
    // this condition is "set same value, didn't change .src"
    entity.appliedComponents.gltfContainer?.instancedEntries?.rootNodes.forEach(root => {
      for (const mesh of root.getChildMeshes(false)) {
        if (mesh.name.endsWith('_collider')) {
          setColliderMask(mesh, newValue.invisibleMeshesCollisionMask ?? DEFAULT_INVISIBLE_COLLIDER_LAYERS)
        } else {
          setColliderMask(mesh, newValue.invisibleMeshesCollisionMask ?? DEFAULT_VISIBLE_COLLIDER_LAYERS)
        }
      }
    })
  } else if (!newValue) {
    removeCurrentGltf(entity)

    // remove the loading state of the removed entity
    const loadingStateComponent = entity.context.deref()?.components[gltfContainerLoadingStateComponent.componentId]
    if (loadingStateComponent) {
      loadingStateComponent.deleteFrom(entity.entityId)
    }
  }
})

// this function releases the current gltf allocated resources and its container
// it won't remove the base meshes, models and textures that are used for the instance
// only the copies
function removeCurrentGltf(entity: BabylonEntity) {
  // first remove the instance of the gltf
  if (entity.appliedComponents.gltfContainer?.instancedEntries) {
    entity.appliedComponents.gltfContainer.instancedEntries.dispose()
    entity.appliedComponents.gltfContainer.instancedEntries = null
  }
  // and then its container
  if (entity.appliedComponents.gltfContainer?.gltfContainer) {
    entity.appliedComponents.gltfContainer.gltfContainer.setEnabled(false)
    entity.appliedComponents.gltfContainer.gltfContainer.parent = null
    entity.appliedComponents.gltfContainer.gltfContainer.dispose(true, true)
    entity.appliedComponents.gltfContainer.gltfContainer = null
  }
}
