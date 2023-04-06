import { Vector2, Vector3 } from "@babylonjs/core"

// each parcel of Decentraland is 16x16 meters
export const PARCEL_SIZE_METERS = 16

/**
 * Converts a string position "-1,5" => { x: -1, y: 5 }
 */
export function parseParcelPosition(position: string): Vector2 {
  const [x, y] = position
    .trim()
    .split(/\s*,\s*/)
    .map(($) => parseInt($, 10))
  return new Vector2(x, y)
}

/**
 * Transforms a world position into a parcel-relative 3d position
 */
export function gridToParcel(base: Vector2, x: number, y: number, target: Vector3) {
  const auxVec3 = Vector3.Zero()
  gridToWorld(base.x, base.y, auxVec3)
  gridToWorld(x, y, target)
  target.x -= auxVec3.x
  target.y -= auxVec3.y
  target.z -= auxVec3.z
}

/**
 * Transforms a grid position into a world-relative 3d position
 */
export function gridToWorld(x: number, y: number, target: Vector3) {
  target.x = x * PARCEL_SIZE_METERS
  target.y = 0
  target.z = y * PARCEL_SIZE_METERS
  return target
}