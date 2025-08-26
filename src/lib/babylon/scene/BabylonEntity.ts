import * as BABYLON from '@babylonjs/core'
import { SceneContext } from './scene-context'
import { Transform } from '../../decentraland/sdk-components/transform-component'
import { ComponentDefinition } from '../../decentraland/crdt-internal/components'
import { Entity } from '../../decentraland/types'
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core'
import { BillboardMode, PBBillboard } from '@dcl/protocol/out-js/decentraland/sdk/components/billboard.gen'
import { PBRaycast } from '@dcl/protocol/out-js/decentraland/sdk/components/raycast.gen'
import { PBMeshCollider } from '@dcl/protocol/out-js/decentraland/sdk/components/mesh_collider.gen'
import { isValidBillboardCombination } from './logic/billboards'
import { PBGltfContainer } from '@dcl/protocol/out-js/decentraland/sdk/components/gltf_container.gen'
import { PBPointerEvents } from '@dcl/protocol/out-js/decentraland/sdk/components/pointer_events.gen'
import { PBMeshRenderer } from '@dcl/protocol/out-js/decentraland/sdk/components/mesh_renderer.gen'
import { AvatarRenderer } from '../avatars/AvatarRenderer'
import { StaticEntities } from './logic/static-entities'
import { PBDelayedInterpolation } from '@dcl/protocol/out-js/decentraland/sdk/components/delayed_interpolation.gen'
import { applyDelayedInterpolation } from './logic/delayed-interpolation'
import { PBTween } from '@dcl/protocol/out-js/decentraland/sdk/components/tween.gen'
import { PBMaterial } from '@dcl/protocol/out-js/decentraland/sdk/components/material.gen'
import { PBAvatarBase } from '@dcl/protocol/out-js/decentraland/sdk/components/avatar_base.gen'
import { memoize } from '../../misc/memoize'

export type TransformCommand = { value: Transform, time: number }

// the following list of components is used to store a "staging" value to compare
// against the previous applied value in the applyChanges function of each component
export type AppliedComponents = {
  transform: {
    commands: Array<TransformCommand>
    parent: Entity
  }
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
  meshRenderer: {
    info: PBMeshRenderer
    mesh: BABYLON.AbstractMesh | null
  }
  gltfContainer: {
    value: PBGltfContainer
    gltfContainer: BABYLON.AbstractMesh | null
    instancedEntries: BABYLON.InstantiatedEntries | null
  }
  pointerEvents: PBPointerEvents
  avatarRenderer: AvatarRenderer
  avatarBase: PBAvatarBase
  delayedInterpolation: PBDelayedInterpolation
  tween: PBTween
  material: {
    value: PBMaterial
    material: BABYLON.Material
  }
}


export const baseMaterial = memoize((scene: BABYLON.Scene) => {
  const material = new BABYLON.StandardMaterial(
    'base-box',
    scene
  )
  material.diffuseTexture = new BABYLON.Texture('images/UV_checker_Map_byValle.jpg')
  return material
})

/**
 * This class wraps a BabylonEntity and extends it with all the component-related
 * logic for the Decentraland ECS semantics.
 */
export class BabylonEntity extends BABYLON.TransformNode {
  readonly isDCLEntity = true
  usedComponents = new Map<number, ComponentDefinition<unknown>>()
  appliedComponents: Partial<AppliedComponents> = {}

  constructor(public entityId: Entity, public context: WeakRef<SceneContext>) {
    super(`ecs-${entityId.toString(16)}`)
  }

  putComponent(component: ComponentDefinition<unknown>) {
    component.declaration.applyChanges(this, component)
    this.usedComponents.set(component.componentId, component)
  }

  deleteComponent(component: ComponentDefinition<unknown>) {
    component.declaration.applyChanges(this, component)
    this.usedComponents.delete(component.componentId)
  }

  // this function chooses which value is going to be used to calculate the world
  // transform of this entity. the order of precedence is:
  // 1. if there are no user defined Transform, use an identity transform
  // 2. if the PBDelayedInterpolation component is present, interpolate a value using the time-traveling commands
  // 3. if the PBTween component is present, interpolate a value using the tweening commands
  // 4. if the PBTransform component is present, use the latest value (command)
  _setTransformParametersBeforeMatrixCalculation() {
    if (!this.rotationQuaternion) this.rotationQuaternion = Quaternion.Identity()

    // perform interpolation if needed
    const commands = this.appliedComponents.transform?.commands

    if (!commands || commands.length === 0) {
      this.position.setAll(0)
      this.scaling.setAll(1)
      this.rotationQuaternion.set(0, 0, 0, 1)
      return
    }

    if (this.appliedComponents.delayedInterpolation) {
      applyDelayedInterpolation(this, this.appliedComponents.delayedInterpolation, commands, performance.now())
    } else /* if(BPTween) {
      applyTween(this, this.appliedComponents.tween!, commands, performance.now())
    } else */ {
      const latestCommand = commands[commands.length - 1]
      this.position.set(latestCommand.value.position.x, latestCommand.value.position.y, latestCommand.value.position.z)
      this.scaling.set(latestCommand.value.scale.x, latestCommand.value.scale.y, latestCommand.value.scale.z)
      this.rotationQuaternion.set(latestCommand.value.rotation.x, latestCommand.value.rotation.y, latestCommand.value.rotation.z, latestCommand.value.rotation.w)
    }
  }

  computeWorldMatrix(force: boolean | undefined, camera?: BABYLON.Nullable<BABYLON.Camera>) {
    if (this.entityId === StaticEntities.RootEntity) {
      return super.computeWorldMatrix(force, camera)
    }

    this._setTransformParametersBeforeMatrixCalculation()

    return super.computeWorldMatrix(force, camera)
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

    return super._afterComputeWorldMatrix()
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
    return this.appliedComponents.transform?.parent ?? StaticEntities.RootEntity
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
      // mark the component as deleted in the component
      component.entityDeleted(this.entityId, false)
      // then perform the final deletion
      this.deleteComponent(component)
    }

    // and then proceed with the native engine disposal
    super.dispose(true, false)
  }
}