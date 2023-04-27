
// export all the functions required to make the scene work
export * from '@dcl/sdk'
import {  GltfContainer, MeshRenderer, Transform, engine } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'

import './validations.test'

// rotate all cubes
engine.addSystem(function rotateCube(dt) {
  for (const [entity] of engine.getEntitiesWith(MeshRenderer)) {
    const mutableTransform = Transform.getMutable(entity)

    mutableTransform.rotation = Quaternion.multiply(
      mutableTransform.rotation,
      Quaternion.fromAngleAxis(dt * 10, Vector3.Up())
    )
  }
})

// rotate all gltf
engine.addSystem(function rotateCube(dt) {
  for (const [entity] of engine.getEntitiesWith(GltfContainer)) {
    const mutableTransform = Transform.getMutable(entity)

    mutableTransform.rotation = Quaternion.multiply(
      mutableTransform.rotation,
      Quaternion.fromAngleAxis(dt * 40, Vector3.Up())
    )
  }
})