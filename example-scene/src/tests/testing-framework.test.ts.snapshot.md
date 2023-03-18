# snapshot test for example-scene/src/tests/testing-framework.test.js
```mermaid
sequenceDiagram
  participant runtime
  participant scene
  participant renderer
  participant babylon
  scene-->>runtime: require("buffer")
  scene-->>runtime: require("long")
  scene-->>runtime: require("~system/Testing")
  scene-->>runtime: require("~system/EngineApi")
  scene-->>runtime: require("~system/EngineApi")
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
  end
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
  Note right of scene: "🧪 Running test testing framework: yield works"
  Note right of scene: "⏱️ yield"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=2
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "⏱️ yield promise"
  end
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
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
  Note right of scene: "⏱️ yield"
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=6 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=4
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "⏱️ yield function"
  end
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
  Note right of scene: "⏱️ yield"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=8 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=6
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "⏱️ yield function"
  end
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
  Note right of scene: "⏱️ yield promise"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=10 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=8
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
  Note right of scene: "⏱️ yield"
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=11 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=9
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🟢 Test passed testing framework: yield works"
  # [TEST RESULT]{"name":"testing framework: yield works","ok":true}
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=12 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0.5) frameNumber=10
  activate scene
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "🧪 Running test testing framework: ensure previous test's yield are resolved"
  Note right of scene: "🟢 Test passed testing framework: ensure previous test's yield are resolved"
  # [TEST RESULT]{"name":"testing framework: ensure previous test's yield are resolved","ok":true}
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    babylon-->>renderer: render()
    babylon-->>renderer: lateRender()
    renderer-->>scene: PUT c=1 e=0x2 t=13 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
  deactivate renderer
  deactivate scene
```

The file that produced this snapshot was:
```typescript
import { engine } from "@dcl/sdk/ecs";
import { assertEquals } from "../testing/assert";
import { test } from "../testing";
export * from '@dcl/sdk'

// this system counts the amount of times it was executed
let renderCount = 1;
engine.addSystem(() => { renderCount++ }, Infinity);

let tickCount = 0;
test("testing framework: yield works", function* () {
  renderCount = 0

  assertEquals(tickCount++, renderCount)
  yield
  assertEquals(tickCount++, renderCount)
  yield Promise.resolve()
  tickCount++ // 1 is added to the tickCount because the promise delays the execution of the next yield
  assertEquals(tickCount++, renderCount) 
  yield () => { }
  tickCount++ // 1 is added to the tickCount because the function call delays the continuation of the test by one tick
  assertEquals(tickCount++, renderCount) 
  yield async () => { }
  tickCount++ // 1 is added to the tickCount because the promise delays the execution of the next yield
  tickCount++ // 1 is added to the tickCount because the function call delays the continuation of the test by one tick
  assertEquals(tickCount++, renderCount) 
});

test("testing framework: ensure previous test's yield are resolved", function* () {
  assertEquals(tickCount, 9)
});
```