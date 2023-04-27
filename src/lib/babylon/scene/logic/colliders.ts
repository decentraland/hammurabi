import { AbstractMesh, Scene } from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { memoize } from '../../../misc/memoize'
import { ColliderLayer } from '@dcl/protocol/out-ts/decentraland/sdk/components/mesh_collider.gen'
import { BabylonEntity } from '../entity'
import { bitIntersectsAndContainsAny } from '../../../misc/bit-operations'
import { AddToggle, guiPanel } from '../../visual/ui'

const colliderSymbol = Symbol('isCollider')

export const colliderMaterial = memoize((scene: Scene) => {
  const m = new GridMaterial('collider-material', scene)
  m.opacity = 0
  m.sideOrientation = 0
  m.mainColor.set(0, 0, 0)
  m.lineColor.set(0, 1, 0)
  m.zOffset = -1
  m.fogEnabled = false
  m.depthFunction = 2
  m.gridRatio = .1
  m.freeze()

  if (typeof OffscreenCanvas !== 'undefined') {
    AddToggle('Show Colliders', guiPanel(scene)).onIsCheckedChangedObservable.add((v) => {
      if (v) {
        m.opacity = 1
      } else {
        m.opacity = 0
      }
    })
  }

  return m
})


export function setColliderMask(mesh: AbstractMesh, layers: number) {
  (mesh as any)[colliderSymbol] = layers

  if (mesh.name.endsWith('_collider')) {
    mesh.material = colliderMaterial(mesh.getScene())
    // mesh.visibility =  0
  }

  mesh.checkCollisions = (layers & ColliderLayer.CL_PHYSICS) != 0
  mesh.isPickable = (layers & ColliderLayer.CL_POINTER) != 0
}

export function getColliderLayers(mesh: AbstractMesh): number {
  return (mesh as any)[colliderSymbol] || 0
}

// this function returns the meshes that match the provided mask
export function pickMeshesForMask(entity: BabylonEntity, mask: number): Iterable<AbstractMesh> {
  if (!mask) return []
  return entity.getChildMeshes(false, (mesh) => {
    if (mesh instanceof AbstractMesh) {
      return bitIntersectsAndContainsAny(getColliderLayers(mesh), mask)
    }
    return true
  })
}