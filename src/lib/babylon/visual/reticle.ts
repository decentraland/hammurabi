import { DynamicTexture, MeshBuilder, Node, Scene, StandardMaterial } from "@babylonjs/core";
import { utilLayer } from "./ui";

export function addCrosshair(scene: Scene, parent: Node) {
  let w = 128

  let texture = new DynamicTexture('reticule', w, scene, false)
  texture.hasAlpha = true

  let ctx = texture.getContext()
  let reticule

  const createOutline = () => {
    let c = 2

    ctx.moveTo(c, w * 0.25)
    ctx.lineTo(c, c)
    ctx.lineTo(w * 0.25, c)

    ctx.moveTo(w * 0.75, c)
    ctx.lineTo(w - c, c)
    ctx.lineTo(w - c, w * 0.25)

    ctx.moveTo(w - c, w * 0.75)
    ctx.lineTo(w - c, w - c)
    ctx.lineTo(w * 0.75, w - c)

    ctx.moveTo(w * 0.25, w - c)
    ctx.lineTo(c, w - c)
    ctx.lineTo(c, w * 0.75)

    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)'
    ctx.stroke()
  }

  const createNavigate = () => {
    ctx.fillStyle = 'transparent'
    ctx.clearRect(0, 0, w, w)
    createOutline()

    ctx.strokeStyle = 'rgba(48, 48, 48, 0.9)'
    ctx.lineWidth = 3.5
    ctx.moveTo(w * 0.5, w * 0.25)
    ctx.lineTo(w * 0.5, w * 0.75)

    ctx.moveTo(w * 0.25, w * 0.5)
    ctx.lineTo(w * 0.75, w * 0.5)
    ctx.stroke()
    ctx.beginPath()

    texture.update()
  }

  createNavigate()

  let material = new StandardMaterial('reticule', scene)
  material.diffuseTexture = texture
  material.opacityTexture = texture
  material.emissiveColor.set(1, 1, 1)
  material.disableLighting = true

  let plane = MeshBuilder.CreatePlane('reticule', { size: 0.04 }, utilLayer(scene).utilityLayerScene)
  plane.material = material
  plane.position.set(0, 0, 1.1)
  plane.isPickable = false
  plane.rotation.z = Math.PI / 4

  reticule = plane
  reticule.parent = parent
  return reticule
}