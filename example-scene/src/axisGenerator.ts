import { engine, Entity, Material, MeshRenderer, Transform } from "@dcl/sdk/ecs";

export function createAxes() {
  const container = engine.addEntity()

  const x = engine.addEntity()
  const y = engine.addEntity()
  const z = engine.addEntity()

  Transform.create(x, { parent: container, position: { x: 0.5, y: 0, z: 0 }, scale: { x: 1, y: 0.01, z: 0.01 } })
  Transform.create(y, { parent: container, position: { x: 0, y: 0.5, z: 0 }, scale: { x: 0.01, y: 1, z: 0.01 } })
  Transform.create(z, { parent: container, position: { x: 0, y: 0, z: 0.5 }, scale: { x: 0.02, y: 0.02, z: 1 } })

  MeshRenderer.setBox(x)
  MeshRenderer.setBox(y)
  MeshRenderer.setBox(z)

  Material.setBasicMaterial(x, { diffuseColor: { r: 1, g: 0, b: 0, a: 1 } })
  Material.setBasicMaterial(y, { diffuseColor: { r: 0, g: 1, b: 0, a: 1 } })
  Material.setBasicMaterial(z, { diffuseColor: { r: 0, g: 0, b: 1, a: 1 } })

  return { container, x, y, z }
}