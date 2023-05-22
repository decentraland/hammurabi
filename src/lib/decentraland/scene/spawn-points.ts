import { Vector3 } from "@babylonjs/core";
import { Scene } from "@dcl/schemas"
import { gridToWorld } from "../positions";

export type InstancedSpawnPoint = { position: Vector3; cameraTarget?: Vector3 }

/**
 * Computes the spawn point based on a scene.
 *
 * The computation takes the spawning points defined in the scene document and computes the spawning point in the world based on the base parcel position.
 *
 * @param scene Scene on which the player is spawning
 * @param loadPosition Parcel position on which the player is teleporting to
 */
export function pickWorldSpawnpoint(scene: Scene): InstancedSpawnPoint {
  const baseParcel = scene.scene.base
  const [bx, by] = baseParcel.split(',')
  const basePosition = new Vector3()
  gridToWorld(parseInt(bx, 10), parseInt(by, 10), basePosition)

  const spawnpoint = pickSpawnpoint(scene)
  const { position, cameraTarget } = spawnpoint

  return {
    position: basePosition.add(position),
    cameraTarget: cameraTarget ? basePosition.add(cameraTarget) : undefined
  }
}

function pickSpawnpoint(land: Scene): InstancedSpawnPoint {
  let spawnPoints = land.spawnPoints
  if (!spawnPoints || !Array.isArray(spawnPoints) || spawnPoints.length === 0) {
    spawnPoints = [
      {
        position: {
          x: 8,
          y: 0,
          z: 8
        }
      }
    ]
  }

  // 1 - default spawn points
  const defaults = spawnPoints.filter(($) => $.default)

  // 2 - if no default spawn points => all existing spawn points
  const eligiblePoints = defaults.length === 0 ? spawnPoints : defaults

  // 3 - get a random spawn point
  const index = Math.floor(Math.random() * eligiblePoints.length)

  const { position, cameraTarget } = eligiblePoints[index]

  // 4 - generate random x, y, z components when in arrays
  const finalPosition = new Vector3(
    computeComponentValue(position.x),
    computeComponentValue(position.y),
    computeComponentValue(position.z)
  )

  return {
    position: finalPosition,
    cameraTarget: new Vector3(cameraTarget?.x ?? 0, cameraTarget?.y ?? 0, cameraTarget?.z ?? 0)
  }
}

function computeComponentValue(x: number | number[]) {
  if (typeof x === 'number') {
    return x
  }

  const length = x.length
  if (length === 0) {
    return 0
  } else if (length < 2) {
    return x[0]
  } else if (length > 2) {
    x = [x[0], x[1]]
  }

  let [min, max] = x

  if (min === max) return max

  if (min > max) {
    const aux = min
    min = max
    max = aux
  }

  return Math.random() * (max - min) + min
}