import * as BABYLON from '@babylonjs/core'
import { PBGltfContainer } from "@dcl/protocol/out-ts/decentraland/sdk/components/gltf_container.gen";
import { declareComponentUsingProtobufJs } from "./pb-based-component-helper";
import { ComponentType } from '../crdt-internal/components';
import { BabylonEntity } from '../../babylon/scene/entity';
import { updatePointerEventsMeshProperties } from './pointer-events';
import { applyAnimations } from './logic/apply-animations';

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
        newGltfContainerValue.instancedEntries = instantiateAssetContainer(assetContainer, entity)

        // apply animations if needed
        applyAnimations(entity)
      }
    })
  } else if (!newValue) {
    removeCurrentGltf(entity)
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

const tmpVector = new BABYLON.Vector3()

export function instantiateAssetContainer(assetContainer: BABYLON.AssetContainer, entity: BabylonEntity): BABYLON.InstantiatedEntries {
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

      const originalF = mesh.isInFrustum

      /**
       * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
       * A mesh is in the frustum if its bounding box intersects the frustum
       * @param frustumPlanes defines the frustum to test
       * @returns true if the mesh is in the frustum planes
       * 
       * In this case, we are monkey patching the isInFrustum method to cull out meshes that are too far away
       * or are too small based on the distance to the camera.
       */
      mesh.isInFrustum = function (this: BABYLON.AbstractMesh, frustumPlanes: BABYLON.Plane[]): boolean {
        if (this.absolutePosition) {
          const distanceToObject = tmpVector.copyFrom(this.absolutePosition).subtract(this.getScene().activeCamera!.position).length()

          // cull out elements farther than 300meters
          if (distanceToObject > 300)
            return false

          if (this._boundingInfo) {
            if (this._boundingInfo.diagonalLength < 0.50 && distanceToObject > 30)
              return false
            // cull elements smaller than 20cm at 40meters
            if (this._boundingInfo.diagonalLength < 0.20 && distanceToObject > 20)
              return false
            // cull elements smaller than 10cm at 20meters
            if (this._boundingInfo.diagonalLength < 0.10 && distanceToObject > 15)
              return false
          }
        }

        return originalF.call(this, frustumPlanes)
      }
    })
  }

  // by default animations will be configured with weight 0
  for (let animationGroup of instances.animationGroups) {
    animationGroup.stop()
    for (let animatable of animationGroup.animatables) {
      animatable.weight = 0
    }
  }

  return instances
}