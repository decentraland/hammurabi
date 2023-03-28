import * as BABYLON from '@babylonjs/core'
import { SceneContext } from './context'
import { Transform } from '../../decentraland/sdk-components/transform-component'
import { ComponentDefinition } from '../../decentraland/crdt-internal/components'
import { Entity } from '../../decentraland/types'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core'
import { BillboardMode, PBBillboard } from '@dcl/protocol/out-ts/decentraland/sdk/components/billboard.gen'
import { PBRaycast } from '@dcl/protocol/out-ts/decentraland/sdk/components/raycast.gen'
import { PBMeshCollider } from '@dcl/protocol/out-ts/decentraland/sdk/components/mesh_collider.gen'
import { isValidBillboardCombination } from './logic/billboards'

// the following list of components is used to store a "staging" value to compare
// against the previous applied value in the applyChanges function of each component
export type AppliedComponents = {
  transform: Transform
  billboard: PBBillboard
  raycast: {
    value: PBRaycast
    helper?: BABYLON.RayHelper
    ray: BABYLON.Ray
  }
  meshCollider: {
    info: PBMeshCollider
    collider: BABYLON.AbstractMesh | null
  }
}

/**
 * This class wraps a BabylonEntity and extends it with all the component-related
 * logic for the Decentraland ECS semantics.
 */
export class BabylonEntity extends BABYLON.TransformNode {
  readonly isDCLEntity = true
  usedComponents = new Map<number, ComponentDefinition<unknown>>()

  meshRenderer?: BABYLON.AbstractMesh

  appliedComponents: Partial<AppliedComponents> = {}

  constructor(public entityId: Entity, public context: WeakRef<SceneContext>) {
    super(`ecs-${entityId.toString(16)}`)
  }

  putComponent(component: ComponentDefinition<unknown>) {
    this.usedComponents.set(component.componentId, component)
  }

  deleteComponent(component: ComponentDefinition<unknown>) {
    this.usedComponents.delete(component.componentId)
  }

  // This function is called after Babylon calculates the world matrix of the entity
  // we hook into this lifecycle event to mutate the final _worldMatrix before it is
  // settled
  _afterComputeWorldMatrix() {
    const camera = this.getScene().activeCamera

    if (this.appliedComponents.billboard && camera) {
      const billboardMode = this.appliedComponents.billboard.billboardMode ?? BillboardMode.BM_ALL

      // save translation and scaling components of the world matrix calculated by Babylon
      const position = Vector3.Zero()
      const scale = Vector3.One()
      this._worldMatrix.decompose(scale, undefined, position)

      // compute the global position of the world matrix
      const entityGlobalPosition = Vector3.TransformCoordinates(Vector3.Zero(), this._worldMatrix)

      // get the direction vector from the camera to the entity position
      const directionVector = camera.globalPosition.subtract(entityGlobalPosition);
      
      // calculate the LookAt matrix from the direction vector towards zero
      const rotMatrix = Matrix.LookAtLH(directionVector, Vector3.Zero(), camera.upVector).invert()
      const rotation = Quaternion.FromRotationMatrix(rotMatrix)

      if (isValidBillboardCombination(billboardMode)) {
        const eulerAngles = rotation.toEulerAngles();

        if (!(billboardMode & BillboardMode.BM_X)) {
          eulerAngles.x = 0;
        }

        if (!(billboardMode & BillboardMode.BM_Y)) {
          eulerAngles.y = 0;
        }

        if (!(billboardMode & BillboardMode.BM_Z)) {
          eulerAngles.z = 0;
        }

        Matrix.RotationYawPitchRollToRef(eulerAngles.y, eulerAngles.x, eulerAngles.z, rotMatrix);
      }

      // restore the scale to a blank scaling matrix
      const scalingMatrix = Matrix.Scaling(scale.x, scale.y, scale.z);

      // apply the scale to the rotation matrix, into _worldMatrix
      scalingMatrix.multiplyToRef(rotMatrix, this._worldMatrix)

      // finally restore the translation into _worldMatrix
      this._worldMatrix.setTranslation(position);
    }

    super._afterComputeWorldMatrix()
  }

  // this function should return false if the world matrix needs to be recalculated
  // it is called internally by Babylon.js internal code
  _isSynchronized() {
    const hasBillboard = !!this.appliedComponents.billboard
    return !hasBillboard && super._isSynchronized()
  }

  /**
   * Returns the parentEntity set by the Transform Component.
   * Defaults to ROOT_ENTITY(0)
   */
  get expectedParentEntityId() {
    return this.appliedComponents.transform?.parent ?? 0
  }

  /**
   * Returns the children that extends EcsEntity, filtering any other Object3D
   */
  *childrenEntities(): Iterable<BabylonEntity> {
    if (this._children)
      for (let i = 0; i < this._children.length; i++) {
        const element = this._children[i] as any
        if (element.isDCLEntity) {
          yield element
        }
      }
  }

  dispose(_doNotRecurse?: boolean | undefined, _disposeMaterialAndTextures?: boolean | undefined): void {
    // first dispose all components
    for (const [_, component] of this.usedComponents) {
      this.deleteComponent(component)
    }

    // and then proceed with the native engine disposal
    super.dispose(true, false)
  }
}