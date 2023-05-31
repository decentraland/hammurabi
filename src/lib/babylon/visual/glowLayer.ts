import * as BABYLON from '@babylonjs/core'

// add effects layer for glow effects
export function addGlowLayer(scene: BABYLON.Scene) {
  const effectLayers: BABYLON.EffectLayer[] = []
  const highlightLayer: BABYLON.HighlightLayer = new BABYLON.HighlightLayer('highlight', scene)

  if (!scene.effectLayers.includes(highlightLayer)) {
    scene.addEffectLayer(highlightLayer)
  }

  highlightLayer.innerGlow = false
  highlightLayer.outerGlow = true

  effectLayers.push(highlightLayer)

  scene.onReadyObservable.addOnce(() => {
    // const gl = new BABYLON.GlowLayer('glow', scene)
    // effectLayers.push(gl)

    effectLayers.forEach(($) => scene.effectLayers.includes($) || scene.addEffectLayer($))

    scene.removeEffectLayer = function (this: any, layer: BABYLON.EffectLayer) {
      if (effectLayers.includes(layer)) return
      scene.constructor.prototype.removeEffectLayer.apply(this, arguments)
    } as any

    scene.addEffectLayer = function (this: any, layer: BABYLON.EffectLayer) {
      if (effectLayers.includes(layer)) return
      scene.constructor.prototype.addEffectLayer.apply(this, arguments)
    } as any
  })

  return {
    effectLayers,
    highlightLayer
  }
}