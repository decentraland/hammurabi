import * as BABYLON from '@babylonjs/core'
import { SceneContext } from './context'
import { Transform } from '../../decentraland/sdk-components/transform'
import { ComponentDefinition } from '../../decentraland/crdt-internal/components'
import { Entity } from '../../decentraland/types'
import { componentPutOperations } from '../../decentraland/sdk-components'
import { MeshBuilder } from '@babylonjs/core'

export type EcsComponents = Partial<{
  transform: Transform
}>

/**
 * This class wraps a BabylonEntity and extends it with all the component-related
 * logic for the Decentraland ECS semantics.
 */
export class BabylonEntity extends BABYLON.TransformNode {
  readonly isDCLEntity = true
  usedComponents = new Map<number, ComponentDefinition<unknown>>()

  meshRenderer?: BABYLON.AbstractMesh
  gltfContainer?: BABYLON.AbstractMesh
  gltfAssetContainer?: BABYLON.AssetContainer

  ecsComponentValues: EcsComponents = {}

  constructor(public entityId: Entity, public context: WeakRef<SceneContext>) {
    super(`ecs-${entityId.toString(16)}`)
    
    if (entityId) {
      // create a box and attach it to an entity
      const baseBox = MeshBuilder.CreateBox('base-box', {
        updatable: false,
      })
      baseBox.checkCollisions = true
      baseBox.parent = this
    }
  }

  putComponent(component: ComponentDefinition<unknown>) {
    this.usedComponents.set(component.componentId, component)
    componentPutOperations[component.componentId]?.call(null, this, component)
  }

  deleteComponent(component: ComponentDefinition<unknown>) {
    this.usedComponents.delete(component.componentId)
    componentPutOperations[component.componentId]?.call(null, this, component)
  }

  /**
   * Returns the parentEntity set by the Transform Component.
   * Defaults to ROOT_ENTITY(0)
   */
  get expectedParentEntityId() {
    return this.ecsComponentValues.transform?.parent ?? 0
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