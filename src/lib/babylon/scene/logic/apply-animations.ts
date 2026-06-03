import * as BABYLON from '@babylonjs/core'
import { BabylonEntity } from "../BabylonEntity";
import { animatorComponent } from "../../../decentraland/sdk-components/animator-component";

// This function applies the specified animations to the gltf animation group
export function applyAnimations(entity: BabylonEntity) {
  const sceneContext = entity.context.deref()

  if (!sceneContext) return

  const component = sceneContext.components[animatorComponent.componentId]

  // get the new value of the animation
  const currentAnimationComponentValue = component.getOrNull(entity.entityId)

  const animationGroups = entity.appliedComponents.gltfContainer?.instancedEntries?.animationGroups || []

  if (currentAnimationComponentValue) {
    for (const animationAttributes of currentAnimationComponentValue.states) {
      // find the animation group
      let clip: BABYLON.AnimationGroup | void = animationGroups.find($ => $.name === animationAttributes.clip)

      if (clip) {
        if (animationAttributes.speed !== undefined) {
          clip.speedRatio = animationAttributes.speed
        }

        if (animationAttributes.shouldReset) {
          clip.reset()
        }

        if (!clip.onAnimationEndObservable.hasObservers()) {
          clip.onAnimationEndObservable.addOnce(() => {
            // dispatchEvent('onAnimationEnd', { clipName: animationAttributes.clip })
          })
        }

        if (animationAttributes.playing && !(clip as any).isPlaying) {
          clip.play(animationAttributes.loop)
        } else if (!animationAttributes.playing && (clip as any).isPlaying) {
          clip.pause()
        }

        if (animationAttributes.weight !== undefined) {
          clip.setWeightForAllAnimatables(animationAttributes.weight)
        }
      }
    }
  } else {
    // animations must be stopped if the component was removed
    for (const animation of animationGroups) {
      animation.stop()
    }
  }
}