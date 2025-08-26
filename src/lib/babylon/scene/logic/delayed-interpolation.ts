
/** 
 * https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking#Entity_interpolation
 * https://gamedev.stackexchange.com/questions/142427/delayed-linear-interpolation-for-networking
 * https://github.com/menduz/Semi-Fixed-Time-Step-Interpolation
 * 
 * The DelayedInterpolation component allows to animate the final transform of an entity.
 * The animation is performed time-traveling back in time .duration amount of milliseconds
 * and linearly interpolating the values of the transform from the past.
 * 
 * The parameters used for this time-travel are set by the transform component and its
 * modifiers like billboard, avatar attachment point, etc.
 * 
 * When an entity changes its parent entity, the tween's time-travel registry will
 * automatically reset. Meaning NO tweening will be performed upon reparenting.
 * 
 * Tweens will be calculated AFTER the final position of the entity is calculated,
 * and BEFORE the position of the child entities is computed. Effectively applying
 * the animation to all its children.
 * 
 * It is important to mention that tweens only apply to the local entity, if a parent entity P
 * has a linear tween, and it has a child entity C with another tween, by moving P, only P's tween will apply,
 * moving C's frame of reference but NOT animating it.
 */
import { BabylonEntity, TransformCommand } from '../BabylonEntity'
import { PBDelayedInterpolation } from '@dcl/protocol/out-js/decentraland/sdk/components/delayed_interpolation.gen'
import { Vector3, Quaternion } from '@babylonjs/core'

export function applyDelayedInterpolation(
  entity: Pick<BabylonEntity, 'scaling' | 'rotationQuaternion' | 'position'>,
  component: PBDelayedInterpolation,
  commands: TransformCommand[],
  now: number
) {
  if (!entity.rotationQuaternion) entity.rotationQuaternion = Quaternion.Identity()

  const shouldInterpolate = component.timeTravelDuration > 0

  if (!commands || commands.length === 0) {
    entity.position.setAll(0)
    entity.scaling.setAll(1)
    entity.rotationQuaternion.set(0, 0, 0, 1)
    return
  }

  const latestState = commands[commands.length - 1]

  if (!shouldInterpolate) {
    entity.position.copyFrom(latestState.value.position)
    entity.scaling.copyFrom(latestState.value.scale)
    entity.rotationQuaternion.copyFrom(latestState.value.rotation)
    return
  }

  const timeInThePast = now - component.timeTravelDuration // ms
  let firstStateIndex = -1
  let secondStateIndex = -1

  for (let i = 0; i < commands.length; i++) {
    const state = commands[i];
    if (state.time > timeInThePast) {
      firstStateIndex = i - 1
      secondStateIndex = i
      break;
    }
  }

  const firstStateCandidate = commands[firstStateIndex];
  const secondStateCandidate = commands[secondStateIndex];

  if (!firstStateCandidate || !secondStateCandidate) {
    entity.position.copyFrom(latestState.value.position)
    entity.scaling.copyFrom(latestState.value.scale)
    entity.rotationQuaternion.copyFrom(latestState.value.rotation)
    return
  }

  const firstState = firstStateCandidate.value
  const secondState = secondStateCandidate.value

  const alpha = (timeInThePast - firstStateCandidate.time) / (secondStateCandidate.time - firstStateCandidate.time)

  Vector3.LerpToRef(firstState.position, secondState.position, alpha, entity.position)
  Vector3.LerpToRef(firstState.scale, secondState.scale, alpha, entity.scaling)
  Quaternion.SlerpToRef(firstState.rotation, secondState.rotation, alpha, entity.rotationQuaternion)
}