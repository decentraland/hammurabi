import { AbstractMesh, Scene } from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { memoize } from '../../misc/memoize'

const colliderSymbol = Symbol('isCollider')

export const colliderMaterial = memoize((scene: Scene) => {
  const m = new GridMaterial('collider-material', scene)
  m.opacity = 0.99
  m.sideOrientation = 0
  m.zOffset = -1
  m.fogEnabled = false
  return m
})

export function markAsCollider(mesh: AbstractMesh) {
  (mesh as any)[colliderSymbol] = true
  mesh.material = colliderMaterial(mesh.getScene())
  mesh.checkCollisions = true
  mesh.visibility = 0
  mesh.isPickable = false
}

export function isColliderMesh(mesh: AbstractMesh) {
  return !!(mesh as any)[colliderSymbol]
}
