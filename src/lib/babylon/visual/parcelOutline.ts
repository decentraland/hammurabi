import * as BABYLON from '@babylonjs/core'
import { GridMaterial } from '@babylonjs/materials'
import { gridToParcel, PARCEL_SIZE_METERS, parseParcelPosition } from "../../decentraland/positions"
import { memoize } from '../../misc/memoize'

export const checkerboardMaterial = memoize((scene: BABYLON.Scene) => {
  const m = new GridMaterial('checkerboard', scene)

  /// --- SIDE EFFECT ---


  m.gridRatio = 1
  m.mainColor = BABYLON.Color3.Gray()
  m.lineColor = BABYLON.Color3.White()
  m.majorUnitFrequency = 8
  m.zOffset = 1
  m.fogEnabled = false
  return m
})

export function createParcelOutline(scene: BABYLON.Scene, basePosition: string, positions: string[]) {
  const decoded = positions.map(parseParcelPosition)
  const parcels = decoded.map($ => new BABYLON.Vector2($.x, $.y))
  const base = parseParcelPosition(basePosition)

  const contains = (v: BABYLON.Vector2): boolean => {
    return !!parcels.find(p => p.equals(v))
  }

  const points: BABYLON.Vector3[][] = []

  const minX = Math.min(...parcels.map($ => $.x)) - 1
  const minY = Math.min(...parcels.map($ => $.y)) - 1
  const maxX = Math.max(...parcels.map($ => $.x)) + 1
  const maxY = Math.max(...parcels.map($ => $.y)) + 1
  /*
   * Iterate over all the parcels in the bounding box surrounding this
   * parcel, and draw a border whenever we change state from inside
   * the parcel to outside the parcel.
   */
  for (let x = minX; x < maxX + 1; x++) {
    for (let y = minY; y < maxY + 1; y++) {
      const p = contains(new BABYLON.Vector2(x, y))
      const northern = contains(new BABYLON.Vector2(x, y - 1))
      const western = contains(new BABYLON.Vector2(x - 1, y))
      if (p !== western) {
        const p1 = new BABYLON.Vector3(0, 0, 0)
        gridToParcel(base, x, y, p1)
        p1.z = p1.z
        const p2 = p1.clone()
        p2.z = p2.z + PARCEL_SIZE_METERS
        points.push([p1, p2])
      }
      if (p !== northern) {
        const p1 = new BABYLON.Vector3(0, 0, 0)
        gridToParcel(base, x, y, p1)
        p1.x = p1.x
        const p2 = p1.clone()
        p2.x = p2.x + PARCEL_SIZE_METERS
        points.push([p1, p2])
      }
    }
  }

  const lines = BABYLON.MeshBuilder.CreateLineSystem('lines', { lines: points }, scene)
  lines.color = BABYLON.Color3.FromHexString('#ff004f')
  lines.isPickable = false

  return { result: lines }
}
