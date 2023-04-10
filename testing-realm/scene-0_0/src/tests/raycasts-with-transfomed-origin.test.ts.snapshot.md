# snapshot test for testing-realm/scene-0_0/src/tests/raycasts-with-transfomed-origin.test.js
```mermaid
sequenceDiagram
  participant runtime
  participant scene
  participant renderer
  participant babylon
  runtime-->>scene: onStart()
  activate scene
  activate renderer
  scene-->>renderer: crdtGetState()
    renderer-->>scene: PUT c=1 e=0x2 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0) frameNumber=0
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=1
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test raycast: raycasting from a translated origin works"
  Note right of scene: "⏱️ yield"
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x200 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x201 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":512}
    scene-->>renderer: PUT c=1067 e=0x201 t=1 #v={"timestamp":3,"originOffset":{"x":0,"y":0,"z":0},"direction":{"$case":"globalTarget","globalTarget":{"x":0,"y":10,"z":0}},"maxDistance":10,"queryType":0,"continuous":false}
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1068 e=0x201 t=1 #v={"timestamp":3,"globalOrigin":{"x":20,"y":0,"z":20},"direction":{"x":-0.6666666865348816,"y":0.3333333432674408,"z":-0.6666666865348816},"hits":[]}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=2
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed raycast: raycasting from a translated origin works"
  # [TEST RESULT]{"name":"raycast: raycasting from a translated origin works","ok":true,"totalFrames":1,"totalTime":0.5}
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=3
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test raycast: localDirection raycasting from a translated origin works"
  Note right of scene: "⏱️ yield"
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x202 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":0}
    scene-->>renderer: PUT c=1 e=0x203 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0.7071067690849304,"_z":0,"_w":0.7071067690849304},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1067 e=0x203 t=1 #v={"timestamp":3,"originOffset":{"x":0,"y":0,"z":0},"direction":{"$case":"localDirection","localDirection":{"x":0,"y":0,"z":1}},"maxDistance":10,"queryType":0,"continuous":false}
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=6 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1068 e=0x203 t=1 #v={"timestamp":3,"globalOrigin":{"x":15,"y":0,"z":15},"direction":{"x":1,"y":0,"z":3.422854533141617e-8},"hits":[]}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=4
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed raycast: localDirection raycasting from a translated origin works"
  # [TEST RESULT]{"name":"raycast: localDirection raycasting from a translated origin works","ok":true,"totalFrames":1,"totalTime":0.5}
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=7 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=5
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test raycast: localDirection raycasting from a translated origin works, with rotated parent"
  Note right of scene: "⏱️ yield"
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x204 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":0}
    scene-->>renderer: PUT c=1 e=0x205 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0.7071067690849304,"_z":0,"_w":0.7071067690849304},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":516}
    scene-->>renderer: PUT c=1 e=0x206 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1067 e=0x206 t=1 #v={"timestamp":3,"originOffset":{"x":0,"y":0,"z":0},"direction":{"$case":"localDirection","localDirection":{"x":0,"y":0,"z":1}},"maxDistance":10,"queryType":0,"continuous":false}
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=8 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1068 e=0x206 t=1 #v={"timestamp":3,"globalOrigin":{"x":15,"y":0,"z":15},"direction":{"x":1,"y":0,"z":3.422854533141617e-8},"hits":[]}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=6
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed raycast: localDirection raycasting from a translated origin works, with rotated parent"
  # [TEST RESULT]{"name":"raycast: localDirection raycasting from a translated origin works, with rotated parent","ok":true,"totalFrames":1,"totalTime":0.5}
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=9 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=7
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test raycast: localDirection raycasting from a translated origin works, with rotated parent and offsetOrigin"
  Note right of scene: "⏱️ yield"
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x207 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":0}
    scene-->>renderer: PUT c=1 e=0x208 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":0,"_z":10},"rotation":{"_isDirty":true,"_x":0,"_y":0.7071067690849304,"_z":0,"_w":0.7071067690849304},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x209 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":520}
    scene-->>renderer: PUT c=1067 e=0x209 t=1 #v={"timestamp":3,"originOffset":{"x":0,"y":0,"z":1},"direction":{"$case":"localDirection","localDirection":{"x":0,"y":0,"z":1}},"maxDistance":10,"queryType":0,"continuous":false}
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=10 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1068 e=0x209 t=1 #v={"timestamp":3,"globalOrigin":{"x":15.5,"y":0,"z":15},"direction":{"x":1,"y":0,"z":3.422854533141617e-8},"hits":[]}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=8
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed raycast: localDirection raycasting from a translated origin works, with rotated parent and offsetOrigin"
  # [TEST RESULT]{"name":"raycast: localDirection raycasting from a translated origin works, with rotated parent and offsetOrigin","ok":true,"totalFrames":1,"totalTime":0.5}
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=11 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene
```

The file that produced this snapshot was:
```typescript
import { Raycast, RaycastQueryType, RaycastResult } from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import { test } from '@dcl/sdk/testing'
import { assertComponentValue } from '@dcl/sdk/testing/assert'
import { createChainedEntities } from './helpers'
export * from '@dcl/sdk'

test("raycast: raycasting from a translated origin works", function* (context) {
  // this is the paremeter of the globalTarget
  const globalTarget = Vector3.create(0, 10, 0)

  // 1. Create an entity that is located in a transformed origin
  const entity = createChainedEntities([
    { position: Vector3.create(10, 0, 10) },
    { position: Vector3.create(10, 0, 10) }
  ])

  Raycast.create(entity, {
    originOffset: Vector3.Zero(),
    direction: { $case: 'globalTarget', globalTarget },
    continuous: false,
    maxDistance: 10,
    queryType: RaycastQueryType.RQT_HIT_FIRST,
    timestamp: 3
  })

  // 2. Wait for the next frame to let the RaycastSystem to process the raycast
  yield

  // this is the global origin of the raycast, result of the translation of the entity
  const globalOrigin = Vector3.create(20, 0, 20)

  // 3. Validate that the RaycastResult component of the entity has the correct direction
  assertComponentValue(entity, RaycastResult, {
    direction: Vector3.normalize(Vector3.subtract(globalTarget, globalOrigin)),
    globalOrigin,
    hits: [],
    timestamp: 3
  })
})

test("raycast: localDirection raycasting from a translated origin works", function* (context) {
  // 1. Create an entity that is located in a transformed origin
  const entity = createChainedEntities([
    {
      position: Vector3.create(10, 0, 10),
      scale: Vector3.create(0.5, 0.5, 0.5),
    },
    {
      position: Vector3.create(10, 0, 10),
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    }
  ])

  Raycast.create(entity, {
    originOffset: Vector3.Zero(),
    direction: { $case: 'localDirection', localDirection: Vector3.Forward() },
    continuous: false,
    maxDistance: 10,
    queryType: RaycastQueryType.RQT_HIT_FIRST,
    timestamp: 3
  })

  // 2. Wait for the next frame to let the RaycastSystem to process the raycast
  yield

  // this is the global origin of the raycast, result of the translation and scaling of the entity
  const globalOrigin = Vector3.create(15, 0, 15)

  // 3. Validate that the RaycastResult component of the entity has the correct direction
  assertComponentValue(entity, RaycastResult, {
    // the direction is now right because the transform was rotated 90 degrees
    direction: Vector3.Right(),
    globalOrigin,
    hits: [],
    timestamp: 3
  })
})

test("raycast: localDirection raycasting from a translated origin works, with rotated parent", function* (context) {
  // 1. Create an entity that is located in a transformed origin
  const entity = createChainedEntities([
    {
      position: Vector3.create(10, 0, 10),
      scale: Vector3.create(0.5, 0.5, 0.5),
    },
    {
      position: Vector3.create(10, 0, 10),
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      scale: Vector3.create(1, 1, 1),
    }
  ])

  Raycast.create(entity, {
    originOffset: Vector3.Zero(),
    direction: { $case: 'localDirection', localDirection: Vector3.Forward() },
    continuous: false,
    maxDistance: 10,
    queryType: RaycastQueryType.RQT_HIT_FIRST,
    timestamp: 3
  })

  // 2. Wait for the next frame to let the RaycastSystem to process the raycast
  yield

  // this is the global origin of the raycast, result of the translation and scaling of the entity
  const globalOrigin = Vector3.create(15, 0, 15)

  // 3. Validate that the RaycastResult component of the entity has the correct direction
  assertComponentValue(entity, RaycastResult, {
    // the direction is now right because the transform was rotated 90 degrees
    direction: Vector3.Right(),
    globalOrigin,
    hits: [],
    timestamp: 3
  })
})


test("raycast: localDirection raycasting from a translated origin works, with rotated parent and offsetOrigin", function* (context) {
  // 1. Create an entity that is located in a transformed origin
  const entity = createChainedEntities([
    {
      position: Vector3.create(10, 0, 10),
      scale: Vector3.create(0.5, 0.5, 0.5),
    },
    {
      position: Vector3.create(10, 0, 10),
      rotation: Quaternion.fromEulerDegrees(0, 90, 0)
    },
    {
      scale: Vector3.create(1, 1, 1),
    }
  ])

  Raycast.create(entity, {
    // in this case, the originOffset is in the local space of the entity one unit forward
    originOffset: Vector3.Forward(),
    direction: { $case: 'localDirection', localDirection: Vector3.Forward() },
    continuous: false,
    maxDistance: 10,
    queryType: RaycastQueryType.RQT_HIT_FIRST,
    timestamp: 3
  })

  // 2. Wait for the next frame to let the RaycastSystem to process the raycast
  yield

  // this is the global origin of the raycast, result of the translation and scaling of the entity
  const globalOrigin = Vector3.create(15, 0, 15)
  const rotatedForwardOrigin = Vector3.add(Vector3.create(0.5, 0, 0), globalOrigin)

  // 3. Validate that the RaycastResult component of the entity has the correct direction
  assertComponentValue(entity, RaycastResult, {
    // the direction is now right because the transform was rotated 90 degrees
    direction: Vector3.Right(),
    // and the globalOrigin is offsetted by originOffset
    globalOrigin: rotatedForwardOrigin,
    hits: [],
    timestamp: 3
  })
})
```