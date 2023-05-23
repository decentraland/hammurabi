import { AnimationGroup, InstantiatedEntries, TransformNode } from '@babylonjs/core'
import { EmoteADR74 } from '@dcl/schemas/dist/platform/item/emote/emote'
import { EmoteWithContainer } from './types'

export interface BabylonEmote {
  animationGroup: AnimationGroup
  emote: EmoteADR74
}

export function createEmote(prefix: string, loadedEmote: EmoteWithContainer, wearablesInstances: Iterable<InstantiatedEntries>): BabylonEmote | void {
  const emoteAnimationGroup = new AnimationGroup(
    prefix + loadedEmote.emote.id,
    loadedEmote.container.scene
  )

  emoteAnimationGroup.stop()

  // play emote animation
  try {
    for (const instance of wearablesInstances) {
      // store all the transform nodes in a map, there can be repeated node ids
      // if a wearable has multiple representations, so for each id we keep an array of nodes
      const nodes = new Map<string, TransformNode[]>()
      instance.rootNodes
        .flatMap($ => $.getChildren($ => $ instanceof TransformNode, false) as TransformNode[])
        .forEach((node) => {
          const list = nodes.get(node.name) || []
          list.push(node)
          return nodes.set(node.name, list)
        })

      // apply each targeted animation from the emote asset container to the transform nodes of all the wearables
      if (loadedEmote.container.animationGroups.length > 0) {
        for (const targetedAnimation of loadedEmote.container.animationGroups[0].targetedAnimations) {
          const target = targetedAnimation.target as TransformNode
          const newTargets = nodes.get(target.name)

          if (newTargets && newTargets.length > 0) {
            const animation = targetedAnimation.animation
            animation.enableBlending = true
            animation.blendingSpeed = 0.1
            if (loadedEmote.emote.emoteDataADR74.loop)
              animation.loopMode = 1

            for (const newTarget of newTargets) {
              emoteAnimationGroup.addTargetedAnimation(animation, newTarget)
            }
          }
        }
      }
    }
    return { animationGroup: emoteAnimationGroup, emote: loadedEmote.emote }
  } catch (error) {
    console.warn(`Could not play emote=${loadedEmote.emote}`, error)
  }
}