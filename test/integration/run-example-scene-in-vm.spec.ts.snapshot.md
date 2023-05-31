# snapshot test for testing-realm/scene-0_1/bin/index.js
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
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x2 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x1 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x5 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=1 #v={"frameNumber":0,"totalRuntime":1,"tickNumber":0}
  deactivate renderer
  deactivate scene

  runtime-->>scene: onUpdate(0) frameNumber=0
  activate scene
  loop Frame
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "CameraTransform: {\"position\":{\"x\":0,\"y\":0,\"z\":0},\"rotation\":{\"x\":0,\"y\":0,\"z\":0,\"w\":1},\"scale\":{\"x\":1,\"y\":1,\"z\":1},\"parent\":0}"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x200 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":-16},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x201 t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":0,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":16,"_y":0.009999999776482582,"_z":16},"parent":512}
    scene-->>renderer: PUT c=1 e=0x202 t=1 #v={"position":{"_isDirty":true,"_x":12,"_y":5,"_z":12},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":512}
    scene-->>renderer: PUT c=1 e=0x203 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1 e=0x204 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x205 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x206 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.25,"_y":0.25,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x207 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x208 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.1666666716337204,"_y":0.1666666716337204,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x209 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x20a t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.125,"_y":0.125,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20b t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20c t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.0833333358168602,"_y":0.0833333358168602,"_z":1},"parent":523}
    scene-->>renderer: PUT c=1 e=0x20d t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":8,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":512}
    scene-->>renderer: PUT c=1 e=0x20e t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":525}
    scene-->>renderer: PUT c=1 e=0x20f t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x210 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x211 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.0555555559694767,"_y":0.0555555559694767,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x212 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x213 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.1666666716337204,"_y":0.1666666716337204,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x214 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x215 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.125,"_y":0.125,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x216 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x217 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.125,"_y":0.125,"_z":1},"parent":534}
    scene-->>renderer: PUT c=1 e=0x218 t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":5,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":512}
    scene-->>renderer: PUT c=1 e=0x219 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":536}
    scene-->>renderer: PUT c=1 e=0x21a t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21b t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21c t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.1666666716337204,"_y":0.1666666716337204,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21d t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21e t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.1666666716337204,"_y":0.1666666716337204,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x21f t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x220 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.1666666716337204,"_y":0.1666666716337204,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x221 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x222 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.0833333358168602,"_y":0.0833333358168602,"_z":1},"parent":545}
    scene-->>renderer: PUT c=1 e=0x223 t=1 #v={"position":{"_isDirty":true,"_x":-16,"_y":0,"_z":-16},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x224 t=1 #v={"position":{"_isDirty":true,"_x":2,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x225 t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x226 t=1 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x227 t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x228 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x229 t=1 #v={"position":{"_isDirty":true,"_x":12,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22a t=1 #v={"position":{"_isDirty":true,"_x":14,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22b t=1 #v={"position":{"_isDirty":true,"_x":16,"_y":1,"_z":2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22c t=1 #v={"position":{"_isDirty":true,"_x":2,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22d t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22e t=1 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x22f t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x230 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x231 t=1 #v={"position":{"_isDirty":true,"_x":12,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x232 t=1 #v={"position":{"_isDirty":true,"_x":14,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x233 t=1 #v={"position":{"_isDirty":true,"_x":16,"_y":1,"_z":4},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x234 t=1 #v={"position":{"_isDirty":true,"_x":2,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x235 t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x236 t=1 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x237 t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x238 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x239 t=1 #v={"position":{"_isDirty":true,"_x":12,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23a t=1 #v={"position":{"_isDirty":true,"_x":14,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23b t=1 #v={"position":{"_isDirty":true,"_x":16,"_y":1,"_z":6},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23c t=1 #v={"position":{"_isDirty":true,"_x":2,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23d t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23e t=1 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x23f t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x240 t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x241 t=1 #v={"position":{"_isDirty":true,"_x":12,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x242 t=1 #v={"position":{"_isDirty":true,"_x":14,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x243 t=1 #v={"position":{"_isDirty":true,"_x":16,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x244 t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":5,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":547}
    scene-->>renderer: PUT c=1 e=0x245 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":580}
    scene-->>renderer: PUT c=1 e=0x246 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x247 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x248 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x249 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x24a t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24b t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24c t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x24d t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x24e t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":1},"parent":589}
    scene-->>renderer: PUT c=1 e=0x24f t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":2,"_y":2,"_z":0.10000000149011612},"parent":589}
    scene-->>renderer: PUT c=1 e=0x250 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":0.10000000149011612},"parent":589}
    scene-->>renderer: PUT c=1 e=0x251 t=1 #v={"position":{"_isDirty":true,"_x":-32,"_y":0,"_z":-16},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x252 t=1 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x254 t=1 #v={"position":{"_isDirty":true,"_x":0.5,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":0.009999999776482582,"_z":0.009999999776482582},"parent":595}
    scene-->>renderer: PUT c=1 e=0x255 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0.5,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.009999999776482582,"_y":1,"_z":0.009999999776482582},"parent":595}
    scene-->>renderer: PUT c=1 e=0x256 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.019999999552965164,"_y":0.019999999552965164,"_z":1},"parent":595}
    scene-->>renderer: PUT c=1 e=0x253 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":2,"_y":2,"_z":2},"parent":594}
    scene-->>renderer: PUT c=1 e=0x257 t=1 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x259 t=1 #v={"position":{"_isDirty":true,"_x":0.5,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":0.009999999776482582,"_z":0.009999999776482582},"parent":600}
    scene-->>renderer: PUT c=1 e=0x25a t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0.5,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.009999999776482582,"_y":1,"_z":0.009999999776482582},"parent":600}
    scene-->>renderer: PUT c=1 e=0x25b t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.019999999552965164,"_y":0.019999999552965164,"_z":1},"parent":600}
    scene-->>renderer: PUT c=1 e=0x258 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":2,"_y":2,"_z":2},"parent":599}
    scene-->>renderer: PUT c=1 e=0x25c t=1 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x25e t=1 #v={"position":{"_isDirty":true,"_x":0.5,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":0.009999999776482582,"_z":0.009999999776482582},"parent":605}
    scene-->>renderer: PUT c=1 e=0x25f t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0.5,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.009999999776482582,"_y":1,"_z":0.009999999776482582},"parent":605}
    scene-->>renderer: PUT c=1 e=0x260 t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.019999999552965164,"_y":0.019999999552965164,"_z":1},"parent":605}
    scene-->>renderer: PUT c=1 e=0x25d t=1 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":2,"_y":2,"_z":2},"parent":604}
    scene-->>renderer: PUT c=1 e=0x261 t=1 #v={"position":{"_isDirty":true,"_x":-2,"_y":1,"_z":-2},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x262 t=1 #v={"position":{"_isDirty":true,"_x":16.5,"_y":0.4508477449417114,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x263 t=1 #v={"position":{"_isDirty":true,"_x":16.5,"_y":0.7821285724639893,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x264 t=1 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.1986393928527832,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x265 t=1 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.6804823875427246,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x266 t=1 #v={"position":{"_isDirty":true,"_x":17.5,"_y":0.7821285724639893,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x267 t=1 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.155571699142456,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x268 t=1 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.5925055742263794,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x269 t=1 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.071303606033325,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26a t=1 #v={"position":{"_isDirty":true,"_x":18.5,"_y":1.1986393928527832,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26b t=1 #v={"position":{"_isDirty":true,"_x":18.5,"_y":1.5925055742263794,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26c t=1 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.0285422801971436,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26d t=1 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.484071731567383,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26e t=1 #v={"position":{"_isDirty":true,"_x":19.5,"_y":1.6804823875427246,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26f t=1 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.071303606033325,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x270 t=1 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.484071731567383,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x271 t=1 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.8958261013031006,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1090 e=0x224 t=1 #v={"billboardMode":0}
    scene-->>renderer: PUT c=1090 e=0x225 t=1 #v={"billboardMode":1}
    scene-->>renderer: PUT c=1090 e=0x226 t=1 #v={"billboardMode":5}
    scene-->>renderer: PUT c=1090 e=0x227 t=1 #v={"billboardMode":3}
    scene-->>renderer: PUT c=1090 e=0x228 t=1 #v={"billboardMode":2}
    scene-->>renderer: PUT c=1090 e=0x229 t=1 #v={"billboardMode":6}
    scene-->>renderer: PUT c=1090 e=0x22a t=1 #v={"billboardMode":4}
    scene-->>renderer: PUT c=1090 e=0x22b t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1090 e=0x22c t=1 #v={"billboardMode":0}
    scene-->>renderer: PUT c=1090 e=0x22d t=1 #v={"billboardMode":1}
    scene-->>renderer: PUT c=1090 e=0x22e t=1 #v={"billboardMode":5}
    scene-->>renderer: PUT c=1090 e=0x22f t=1 #v={"billboardMode":3}
    scene-->>renderer: PUT c=1090 e=0x230 t=1 #v={"billboardMode":2}
    scene-->>renderer: PUT c=1090 e=0x231 t=1 #v={"billboardMode":6}
    scene-->>renderer: PUT c=1090 e=0x232 t=1 #v={"billboardMode":4}
    scene-->>renderer: PUT c=1090 e=0x233 t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1090 e=0x234 t=1 #v={"billboardMode":0}
    scene-->>renderer: PUT c=1090 e=0x235 t=1 #v={"billboardMode":1}
    scene-->>renderer: PUT c=1090 e=0x236 t=1 #v={"billboardMode":5}
    scene-->>renderer: PUT c=1090 e=0x237 t=1 #v={"billboardMode":3}
    scene-->>renderer: PUT c=1090 e=0x238 t=1 #v={"billboardMode":2}
    scene-->>renderer: PUT c=1090 e=0x239 t=1 #v={"billboardMode":6}
    scene-->>renderer: PUT c=1090 e=0x23a t=1 #v={"billboardMode":4}
    scene-->>renderer: PUT c=1090 e=0x23b t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1090 e=0x23c t=1 #v={"billboardMode":0}
    scene-->>renderer: PUT c=1090 e=0x23d t=1 #v={"billboardMode":1}
    scene-->>renderer: PUT c=1090 e=0x23e t=1 #v={"billboardMode":5}
    scene-->>renderer: PUT c=1090 e=0x23f t=1 #v={"billboardMode":3}
    scene-->>renderer: PUT c=1090 e=0x240 t=1 #v={"billboardMode":2}
    scene-->>renderer: PUT c=1090 e=0x241 t=1 #v={"billboardMode":6}
    scene-->>renderer: PUT c=1090 e=0x242 t=1 #v={"billboardMode":4}
    scene-->>renderer: PUT c=1090 e=0x243 t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1090 e=0x24f t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1090 e=0x257 t=1 #v={"billboardMode":7}
    scene-->>renderer: PUT c=1062 e=0x261 t=1 #v={"pointerEvents":[{"eventType":1,"eventInfo":{"button":1,"hoverText":"Press E to spawn","maxDistance":100,"showFeedback":true}}]}
    scene-->>renderer: PUT c=1067 e=0x20b t=1 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"localDirection","localDirection":{"x":0,"y":0,"z":1}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1067 e=0x216 t=1 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalTarget","globalTarget":{"x":0,"y":-1,"z":1}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1067 e=0x221 t=1 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalDirection","globalDirection":{"x":0,"y":-1,"z":0}},"maxDistance":999,"queryType":0,"continuous":true,"collisionMask":2}
    scene-->>renderer: PUT c=1067 e=0x25c t=1 #v={"direction":{"$case":"globalDirection","globalDirection":{"x":0,"y":-1,"z":0}},"maxDistance":32,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1017 e=0x254 t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":1,"g":0,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x255 t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":1,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x256 t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":0,"b":1,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x259 t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":1,"g":0,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x25a t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":1,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x25b t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":0,"b":1,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x25e t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":1,"g":0,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x25f t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":1,"b":0,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x260 t=1 #v={"material":{"$case":"unlit","unlit":{"diffuseColor":{"r":0,"g":0,"b":1,"a":1}}}}
    scene-->>renderer: PUT c=1017 e=0x261 t=1 #v={"material":{"$case":"pbr","pbr":{"albedoColor":{"r":1,"g":0,"b":0.41999998688697815,"a":1}}}}
    scene-->>renderer: PUT c=1018 e=0x201 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x204 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x206 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x208 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x20a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x20c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x20f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x211 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x213 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x215 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x217 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x21a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x21c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x21e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x220 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x222 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x224 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x225 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x226 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x227 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x228 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x229 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22b t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22d t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x22f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x230 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x231 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x232 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x233 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x234 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x235 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x236 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x237 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x238 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x239 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23b t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23d t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x23f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x240 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x241 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x242 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x243 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x246 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x248 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x24a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x24c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x24e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x24f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x250 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x252 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x254 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x255 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x256 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x257 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x259 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x25a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x25b t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x25c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x25e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x25f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x260 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x261 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x262 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x263 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x264 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x265 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x266 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x267 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x268 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x269 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26a t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26b t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26c t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26d t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26e t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x26f t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x270 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1018 e=0x271 t=1 #v={"mesh":{"$case":"box","box":{"uvs":[]}}}
    scene-->>renderer: PUT c=1019 e=0x201 t=1 #v={"collisionMask":2,"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x224 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x225 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x226 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x227 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x228 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x229 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22a t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22b t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22c t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22d t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22e t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x22f t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x230 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x231 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x232 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x233 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x234 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x235 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x236 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x237 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x238 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x239 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23a t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23b t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23c t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23d t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23e t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x23f t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x240 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x241 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x242 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x243 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x24f t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x261 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x262 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x263 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x264 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x265 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x266 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x267 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x268 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x269 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26a t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26b t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26c t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26d t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26e t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x26f t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x270 t=1 #v={"mesh":{"$case":"box","box":{}}}
    scene-->>renderer: PUT c=1019 e=0x271 t=1 #v={"mesh":{"$case":"box","box":{}}}
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x1 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x2 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=2 #v={"frameNumber":1,"totalRuntime":1,"tickNumber":1}
    renderer-->>scene: PUT c=1068 e=0x20b t=1 #v={"timestamp":0,"globalOrigin":{"x":12,"y":5,"z":2.0999999046325684},"direction":{"x":0,"y":0,"z":1},"hits":[],"tickNumber":1}
    renderer-->>scene: PUT c=1068 e=0x216 t=1 #v={"timestamp":0,"globalOrigin":{"x":8,"y":8,"z":-1.899999976158142},"direction":{"x":-0.645896852016449,"y":-0.7266339063644409,"z":0.23413759469985962},"hits":[],"tickNumber":1}
    renderer-->>scene: PUT c=1068 e=0x221 t=1 #v={"timestamp":0,"globalOrigin":{"x":4,"y":5,"z":-5.900000095367432},"direction":{"x":0,"y":-1,"z":0},"hits":[{"position":{"x":4,"y":0.004999999888241291,"z":-5.900000095367432},"globalOrigin":{"x":4,"y":5,"z":-5.900000095367432},"direction":{"x":0,"y":-1,"z":0},"normalHit":{"x":0,"y":1,"z":0},"length":4.994999885559082,"meshName":"box_collider","entityId":513}],"tickNumber":1}
    renderer-->>scene: PUT c=1068 e=0x25c t=1 #v={"timestamp":0,"globalOrigin":{"x":-22,"y":1,"z":-8},"direction":{"x":0,"y":-1,"z":0},"hits":[],"tickNumber":1}
  deactivate renderer
  end
  deactivate scene

  runtime-->>scene: onUpdate(0.1) frameNumber=1
  activate scene
  loop Frame
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "CameraTransform: {\"position\":{\"x\":0,\"y\":0,\"z\":0},\"rotation\":{\"x\":0,\"y\":0,\"z\":0,\"w\":1},\"scale\":{\"x\":1,\"y\":1,\"z\":1},\"parent\":0}"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x261 t=2 #v={"position":{"_isDirty":true,"_x":-2,"_y":1,"_z":-2},"rotation":{"_isDirty":true,"_x":0,"_y":0.008726535364985466,"_z":0,"_w":0.9999619126319885},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x203 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1 e=0x205 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.007490979507565498,"_y":0.014981481246650219,"_z":0.00011224171612411737,"_w":0.9998596906661987},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x207 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x209 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.0037763696163892746,"_y":0.007552687544375658,"_z":0.000028522756110760383,"_w":0.9999643564224243},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x20b t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.002524489304050803,"_y":0.0050489641726017,"_z":0.000012746259926643688,"_w":0.999984085559845},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20e t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":525}
    scene-->>renderer: PUT c=1 e=0x210 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.0016860720934346318,"_y":0.003372139995917678,"_z":0.0000056857115851016715,"_w":0.9999929070472717},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x212 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x214 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.0037763696163892746,"_y":0.007552687544375658,"_z":0.000028522756110760383,"_w":0.9999643564224243},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x216 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.0037763696163892746,"_y":0.007552687544375658,"_z":0.000028522756110760383,"_w":0.9999643564224243},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x219 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":536}
    scene-->>renderer: PUT c=1 e=0x21b t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21d t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21f t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x221 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.002524489304050803,"_y":0.0050489641726017,"_z":0.000012746259926643688,"_w":0.999984085559845},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x245 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":580}
    scene-->>renderer: PUT c=1 e=0x247 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x249 t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x24b t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24d t=2 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x272 t=1 #v={"position":{"_isDirty":true,"_x":4,"_y":0.004999999888241291,"_z":-5.900000095367432},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x257 t=2 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0.008726535364985466,"_z":0,"_w":0.9999619126319885},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x252 t=2 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x25c t=2 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":-0.012245189398527145,"_y":-0.8188808560371399,"_z":-0.01748245768249035,"_w":0.5735664963722229},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x262 t=2 #v={"position":{"_isDirty":true,"_x":16.5,"_y":0.667803943157196,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x263 t=2 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.045296311378479,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x264 t=2 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.4951616525650024,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x265 t=2 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.9932667016983032,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x266 t=2 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.045296311378479,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x267 t=2 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.4495824575424194,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x268 t=2 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.903828501701355,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x269 t=2 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.3830957412719727,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26a t=2 #v={"position":{"_isDirty":true,"_x":18.5,"_y":1.4951616525650024,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26b t=2 #v={"position":{"_isDirty":true,"_x":18.5,"_y":1.903828501701355,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26c t=2 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.3410279750823975,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26d t=2 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.7816784381866455,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26e t=2 #v={"position":{"_isDirty":true,"_x":19.5,"_y":1.9932667016983032,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26f t=2 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.3830957412719727,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x270 t=2 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.7816784381866455,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x271 t=2 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.1645259857177734,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1067 e=0x216 t=2 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalTarget","globalTarget":{"x":0.0998334139585495,"y":-1,"z":0.9950041770935059}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1018 e=0x272 t=1 #v={"mesh":{"$case":"sphere","sphere":{}}}
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x1 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x2 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=3 #v={"frameNumber":2,"totalRuntime":1,"tickNumber":2}
    renderer-->>scene: PUT c=1068 e=0x20b t=2 #v={"timestamp":0,"globalOrigin":{"x":12.52703857421875,"y":5.26401424407959,"z":2.0634987354278564},"direction":{"x":0.13365408778190613,"y":0.06696882098913193,"z":0.9887627363204956},"hits":[],"tickNumber":2}
    renderer-->>scene: PUT c=1068 e=0x216 t=2 #v={"timestamp":0,"globalOrigin":{"x":8.438006401062012,"y":8.219356536865234,"z":-1.925059199333191},"direction":{"x":-0.6529991030693054,"y":-0.722008466720581,"z":0.22868303954601288},"hits":[],"tickNumber":2}
    renderer-->>scene: PUT c=1068 e=0x221 t=2 #v={"timestamp":0,"globalOrigin":{"x":4.497230529785156,"y":5.249053001403809,"z":-5.93255615234375},"direction":{"x":0,"y":-1,"z":0},"hits":[{"position":{"x":4.497230529785156,"y":0.004999999888241291,"z":-5.93255615234375},"globalOrigin":{"x":4.497230529785156,"y":5.249053001403809,"z":-5.93255615234375},"direction":{"x":0,"y":-1,"z":0},"normalHit":{"x":0,"y":1,"z":0},"length":5.244052886962891,"meshName":"box_collider","entityId":513}],"tickNumber":2}
    renderer-->>scene: PUT c=1068 e=0x25c t=2 #v={"timestamp":0,"globalOrigin":{"x":-22,"y":1,"z":-8},"direction":{"x":0,"y":-1,"z":0},"hits":[],"tickNumber":2}
  deactivate renderer
  end
  deactivate scene

  runtime-->>scene: onUpdate(0.2) frameNumber=2
  activate scene
  loop Frame
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "CameraTransform: {\"position\":{\"x\":0,\"y\":0,\"z\":0},\"rotation\":{\"x\":0,\"y\":0,\"z\":0,\"w\":1},\"scale\":{\"x\":1,\"y\":1,\"z\":1},\"parent\":0}"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x272 t=2 #v={"position":{"_isDirty":true,"_x":4,"_y":0.004999999888241291,"_z":-5.900000095367432},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.800000011920929,"_y":0.800000011920929,"_z":0.800000011920929},"parent":0}
    scene-->>renderer: PUT c=1 e=0x261 t=3 #v={"position":{"_isDirty":true,"_x":-2,"_y":1,"_z":-2},"rotation":{"_isDirty":true,"_x":0,"_y":0.026176948100328445,"_z":0,"_w":0.9996573328971863},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x203 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1 e=0x205 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02175501547753811,"_y":0.04349060729146004,"_z":0.0009472598903812468,"_w":0.9988164901733398},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x207 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x209 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.011144883930683136,"_y":0.022287938743829727,"_z":0.00024847366148605943,"_w":0.9996894598007202},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x20b t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.007490979507565498,"_y":0.014981481246650219,"_z":0.00011224171612411737,"_w":0.9998596906661987},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20e t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":525}
    scene-->>renderer: PUT c=1 e=0x210 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.005021386314183474,"_y":0.01004264410585165,"_z":0.00005043117198511027,"_w":0.9999369382858276},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x212 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x214 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.011144883930683136,"_y":0.022287938743829727,"_z":0.00024847366148605943,"_w":0.9996894598007202},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x216 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.011144883930683136,"_y":0.022287938743829727,"_z":0.00024847366148605943,"_w":0.9996894598007202},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x219 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":536}
    scene-->>renderer: PUT c=1 e=0x21b t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21d t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21f t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x221 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.007490979507565498,"_y":0.014981481246650219,"_z":0.00011224171612411737,"_w":0.9998596906661987},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x245 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":580}
    scene-->>renderer: PUT c=1 e=0x247 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x249 t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x24b t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24d t=3 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x273 t=1 #v={"position":{"_isDirty":true,"_x":4.497230529785156,"_y":0.004999999888241291,"_z":-5.93255615234375},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x257 t=3 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0.026176948100328445,"_z":0,"_w":0.9996573328971863},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x252 t=3 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x25c t=3 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":-0.012245189398527145,"_y":-0.8188808560371399,"_z":-0.01748245768249035,"_w":0.5735664963722229},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x262 t=3 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.1939756870269775,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x263 t=3 #v={"position":{"_isDirty":true,"_x":16.5,"_y":1.6350969076156616,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x264 t=3 #v={"position":{"_isDirty":true,"_x":16.5,"_y":2.1178910732269287,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x265 t=3 #v={"position":{"_isDirty":true,"_x":16.5,"_y":2.611626625061035,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x266 t=3 #v={"position":{"_isDirty":true,"_x":17.5,"_y":1.6350969076156616,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x267 t=3 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.070690155029297,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x268 t=3 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.5258545875549316,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x269 t=3 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.970935821533203,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26a t=3 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.1178910732269287,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26b t=3 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.5258545875549316,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26c t=3 #v={"position":{"_isDirty":true,"_x":18.5,"_y":2.9333200454711914,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26d t=3 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.312295436859131,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26e t=3 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.611626625061035,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26f t=3 #v={"position":{"_isDirty":true,"_x":19.5,"_y":2.970935821533203,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x270 t=3 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.312295436859131,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x271 t=3 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.609992027282715,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1067 e=0x216 t=3 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalTarget","globalTarget":{"x":0.29552021622657776,"y":-1,"z":0.9553365111351013}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1018 e=0x273 t=1 #v={"mesh":{"$case":"sphere","sphere":{}}}
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x1 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x2 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=4 #v={"frameNumber":3,"totalRuntime":1,"tickNumber":3}
    renderer-->>scene: PUT c=1068 e=0x20b t=3 #v={"timestamp":0,"globalOrigin":{"x":13.474966049194336,"y":5.749396324157715,"z":1.8032841682434082},"direction":{"x":0.373268187046051,"y":0.19000588357448578,"z":0.9080576300621033},"hits":[],"tickNumber":3}
    renderer-->>scene: PUT c=1068 e=0x216 t=3 #v={"timestamp":0,"globalOrigin":{"x":9.232139587402344,"y":8.624689102172852,"z":-2.1039347648620605},"direction":{"x":-0.6626867651939392,"y":-0.7137099504470825,"z":0.22685742378234863},"hits":[],"tickNumber":3}
    renderer-->>scene: PUT c=1068 e=0x221 t=3 #v={"timestamp":0,"globalOrigin":{"x":5.395548343658447,"y":5.708364009857178,"z":-6.165409564971924},"direction":{"x":0,"y":-1,"z":0},"hits":[{"position":{"x":5.395548343658447,"y":0.004999999888241291,"z":-6.165409564971924},"globalOrigin":{"x":5.395548343658447,"y":5.708364009857178,"z":-6.165409564971924},"direction":{"x":0,"y":-1,"z":0},"normalHit":{"x":0,"y":1,"z":0},"length":5.70336389541626,"meshName":"box_collider","entityId":513}],"tickNumber":3}
    renderer-->>scene: PUT c=1068 e=0x25c t=3 #v={"timestamp":0,"globalOrigin":{"x":-22,"y":1,"z":-8},"direction":{"x":0,"y":-1,"z":0},"hits":[],"tickNumber":3}
  deactivate renderer
  end
  deactivate scene

  runtime-->>scene: onUpdate(0.3) frameNumber=3
  activate scene
  loop Frame
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "CameraTransform: {\"position\":{\"x\":0,\"y\":0,\"z\":0},\"rotation\":{\"x\":0,\"y\":0,\"z\":0,\"w\":1},\"scale\":{\"x\":1,\"y\":1,\"z\":1},\"parent\":0}"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x272 t=3 #v={"position":{"_isDirty":true,"_x":4,"_y":0.004999999888241291,"_z":-5.900000095367432},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":0}
    scene-->>renderer: PUT c=1 e=0x273 t=2 #v={"position":{"_isDirty":true,"_x":4.497230529785156,"_y":0.004999999888241291,"_z":-5.93255615234375},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.699999988079071,"_y":0.699999988079071,"_z":0.699999988079071},"parent":0}
    scene-->>renderer: PUT c=1 e=0x261 t=4 #v={"position":{"_isDirty":true,"_x":-2,"_y":1,"_z":-2},"rotation":{"_isDirty":true,"_x":0,"_y":0.0523359552025795,"_z":0,"_w":0.9986295104026794},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x203 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1 e=0x205 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04153328016400337,"_y":0.08284658938646317,"_z":0.003455783473327756,"_w":0.9956904649734497},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x207 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02855014242231846,"_y":0.057047367095947266,"_z":0.0016320368740707636,"_w":0.9979618191719055},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x209 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02175501547753811,"_y":0.04349060729146004,"_z":0.0009472598903812468,"_w":0.9988164901733398},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x20b t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20e t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":525}
    scene-->>renderer: PUT c=1 e=0x210 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.009933589026331902,"_y":0.019865944981575012,"_z":0.00019738882838282734,"_w":0.9997532963752747},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x212 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02855014242231846,"_y":0.057047367095947266,"_z":0.0016320368740707636,"_w":0.9979618191719055},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x214 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02175501547753811,"_y":0.04349060729146004,"_z":0.0009472598903812468,"_w":0.9988164901733398},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x216 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02175501547753811,"_y":0.04349060729146004,"_z":0.0009472598903812468,"_w":0.9988164901733398},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x219 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":536}
    scene-->>renderer: PUT c=1 e=0x21b t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02855014242231846,"_y":0.057047367095947266,"_z":0.0016320368740707636,"_w":0.9979618191719055},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21d t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02855014242231846,"_y":0.057047367095947266,"_z":0.0016320368740707636,"_w":0.9979618191719055},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21f t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.02855014242231846,"_y":0.057047367095947266,"_z":0.0016320368740707636,"_w":0.9979618191719055},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x221 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.014739283360540867,"_y":0.029473740607500076,"_z":0.0004346579371485859,"_w":0.9994567632675171},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x245 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":580}
    scene-->>renderer: PUT c=1 e=0x247 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x249 t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x24b t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24d t=4 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.07673723995685577,"_y":0.15097640454769135,"_z":0.011756162159144878,"_w":0.9854843020439148},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x274 t=1 #v={"position":{"_isDirty":true,"_x":5.395548343658447,"_y":0.004999999888241291,"_z":-6.165409564971924},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x257 t=4 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0.0523359552025795,"_z":0,"_w":0.9986295104026794},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x252 t=4 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x25c t=4 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":-0.012245189398527145,"_y":-0.8188808560371399,"_z":-0.01748245768249035,"_w":0.5735664963722229},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x262 t=4 #v={"position":{"_isDirty":true,"_x":16.5,"_y":2.1128063201904297,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x263 t=4 #v={"position":{"_isDirty":true,"_x":16.5,"_y":2.5676093101501465,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x264 t=4 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.011443853378296,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x265 t=4 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.4094443321228027,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x266 t=4 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.5676093101501465,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x267 t=4 #v={"position":{"_isDirty":true,"_x":17.5,"_y":2.9703989028930664,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x268 t=4 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.344573974609375,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x269 t=4 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.658916711807251,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26a t=4 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.011443853378296,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26b t=4 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.344573974609375,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26c t=4 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.634645938873291,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26d t=4 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.8544557094573975,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26e t=4 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.4094443321228027,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26f t=4 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.658916711807251,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x270 t=4 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.8544557094573975,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x271 t=4 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.973200559616089,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1067 e=0x216 t=4 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalTarget","globalTarget":{"x":0.5646424889564514,"y":-1,"z":0.8253356218338013}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1018 e=0x274 t=1 #v={"mesh":{"$case":"sphere","sphere":{}}}
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x1 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x2 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=5 #v={"frameNumber":4,"totalRuntime":1,"tickNumber":4}
    renderer-->>scene: PUT c=1068 e=0x20b t=4 #v={"timestamp":0,"globalOrigin":{"x":14.586153984069824,"y":6.373244285583496,"z":1.085394263267517},"direction":{"x":0.6429452896118164,"y":0.34357091784477234,"z":0.6845293045043945},"hits":[],"tickNumber":4}
    renderer-->>scene: PUT c=1068 e=0x216 t=4 #v={"timestamp":0,"globalOrigin":{"x":10.19977855682373,"y":9.159587860107422,"z":-2.6028285026550293},"direction":{"x":-0.6683892607688904,"y":-0.7047704458236694,"z":0.23781169950962067},"hits":[],"tickNumber":4}
    renderer-->>scene: PUT c=1068 e=0x221 t=4 #v={"timestamp":0,"globalOrigin":{"x":6.464929103851318,"y":6.304361343383789,"z":-6.812770366668701},"direction":{"x":0,"y":-1,"z":0},"hits":[{"position":{"x":6.464929103851318,"y":0.004999999888241291,"z":-6.812770366668701},"globalOrigin":{"x":6.464929103851318,"y":6.304361343383789,"z":-6.812770366668701},"direction":{"x":0,"y":-1,"z":0},"normalHit":{"x":0,"y":1,"z":0},"length":6.299361228942871,"meshName":"box_collider","entityId":513}],"tickNumber":4}
    renderer-->>scene: PUT c=1068 e=0x25c t=4 #v={"timestamp":0,"globalOrigin":{"x":-22,"y":1,"z":-8},"direction":{"x":0,"y":-1,"z":0},"hits":[],"tickNumber":4}
  deactivate renderer
  end
  deactivate scene

  runtime-->>scene: onUpdate(0.4) frameNumber=4
  activate scene
  loop Frame
  loop Run Systems
  scene-->>scene: engine.update()
  Note right of scene: "CameraTransform: {\"position\":{\"x\":0,\"y\":0,\"z\":0},\"rotation\":{\"x\":0,\"y\":0,\"z\":0,\"w\":1},\"scale\":{\"x\":1,\"y\":1,\"z\":1},\"parent\":0}"
  end
  scene->>renderer: crdtSendToRenderer()
  activate renderer
    scene-->>renderer: PUT c=1 e=0x272 t=4 #v={"position":{"_isDirty":true,"_x":4,"_y":0.004999999888241291,"_z":-5.900000095367432},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.10000000149011612,"_y":0.10000000149011612,"_z":0.10000000149011612},"parent":0}
    scene-->>renderer: PUT c=1 e=0x273 t=3 #v={"position":{"_isDirty":true,"_x":4.497230529785156,"_y":0.004999999888241291,"_z":-5.93255615234375},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.30000001192092896,"_y":0.30000001192092896,"_z":0.30000001192092896},"parent":0}
    scene-->>renderer: PUT c=1 e=0x274 t=2 #v={"position":{"_isDirty":true,"_x":5.395548343658447,"_y":0.004999999888241291,"_z":-6.165409564971924},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.6000000238418579,"_y":0.6000000238418579,"_z":0.6000000238418579},"parent":0}
    scene-->>renderer: PUT c=1 e=0x261 t=5 #v={"position":{"_isDirty":true,"_x":-2,"_y":1,"_z":-2},"rotation":{"_isDirty":true,"_x":0,"_y":0.08715574443340302,"_z":0,"_w":0.9961947202682495},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x203 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":514}
    scene-->>renderer: PUT c=1 e=0x205 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.06549831479787827,"_y":0.12967301905155182,"_z":0.008584758266806602,"_w":0.9893538951873779},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":515}
    scene-->>renderer: PUT c=1 e=0x207 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04569718614220619,"_y":0.09107557684183121,"_z":0.004183711018413305,"_w":0.9947861433029175},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":517}
    scene-->>renderer: PUT c=1 e=0x209 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.035138074308633804,"_y":0.07016035169363022,"_z":0.002472932217642665,"_w":0.9969136118888855},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":519}
    scene-->>renderer: PUT c=1 e=0x20b t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.024043932557106018,"_y":0.0480598621070385,"_z":0.0011572210351005197,"_w":0.9985543489456177},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":521}
    scene-->>renderer: PUT c=1 e=0x20e t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":525}
    scene-->>renderer: PUT c=1 e=0x210 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.01631803810596466,"_y":0.032629165798425674,"_z":0.0005327987018972635,"_w":0.9993341565132141},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":526}
    scene-->>renderer: PUT c=1 e=0x212 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04569718614220619,"_y":0.09107557684183121,"_z":0.004183711018413305,"_w":0.9947861433029175},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":528}
    scene-->>renderer: PUT c=1 e=0x214 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.035138074308633804,"_y":0.07016035169363022,"_z":0.002472932217642665,"_w":0.9969136118888855},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":530}
    scene-->>renderer: PUT c=1 e=0x216 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.035138074308633804,"_y":0.07016035169363022,"_z":0.002472932217642665,"_w":0.9969136118888855},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":532}
    scene-->>renderer: PUT c=1 e=0x219 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":536}
    scene-->>renderer: PUT c=1 e=0x21b t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04569718614220619,"_y":0.09107557684183121,"_z":0.004183711018413305,"_w":0.9947861433029175},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":537}
    scene-->>renderer: PUT c=1 e=0x21d t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04569718614220619,"_y":0.09107557684183121,"_z":0.004183711018413305,"_w":0.9947861433029175},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":539}
    scene-->>renderer: PUT c=1 e=0x21f t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.04569718614220619,"_y":0.09107557684183121,"_z":0.004183711018413305,"_w":0.9947861433029175},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":541}
    scene-->>renderer: PUT c=1 e=0x221 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.024043932557106018,"_y":0.0480598621070385,"_z":0.0011572210351005197,"_w":0.9985543489456177},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":543}
    scene-->>renderer: PUT c=1 e=0x245 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":580}
    scene-->>renderer: PUT c=1 e=0x247 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":581}
    scene-->>renderer: PUT c=1 e=0x249 t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":583}
    scene-->>renderer: PUT c=1 e=0x24b t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":585}
    scene-->>renderer: PUT c=1 e=0x24d t=5 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":1},"rotation":{"_isDirty":true,"_x":-0.11974720656871796,"_y":0.22502100467681885,"_z":0.02787771075963974,"_w":0.9665655493736267},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":587}
    scene-->>renderer: PUT c=1 e=0x275 t=1 #v={"position":{"_isDirty":true,"_x":6.464929103851318,"_y":0.004999999888241291,"_z":-6.812770366668701},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x257 t=5 #v={"position":{"_isDirty":true,"_x":8,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0.08715574443340302,"_z":0,"_w":0.9961947202682495},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x252 t=5 #v={"position":{"_isDirty":true,"_x":6,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x25c t=5 #v={"position":{"_isDirty":true,"_x":10,"_y":1,"_z":8},"rotation":{"_isDirty":true,"_x":-0.012245189398527145,"_y":-0.8188808560371399,"_z":-0.01748245768249035,"_w":0.5735664963722229},"scale":{"_isDirty":true,"_x":0.5,"_y":0.5,"_z":0.5},"parent":593}
    scene-->>renderer: PUT c=1 e=0x262 t=5 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.2649614810943604,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x263 t=5 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.5864391326904297,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x264 t=5 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.8324358463287354,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x265 t=5 #v={"position":{"_isDirty":true,"_x":16.5,"_y":3.9743120670318604,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x266 t=5 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.5864391326904297,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x267 t=5 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.8129923343658447,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x268 t=5 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.9580471515655518,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x269 t=5 #v={"position":{"_isDirty":true,"_x":17.5,"_y":3.9987285137176514,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26a t=5 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.8324358463287354,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26b t=5 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.9580471515655518,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26c t=5 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.9997963905334473,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26d t=5 #v={"position":{"_isDirty":true,"_x":18.5,"_y":3.9405345916748047,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26e t=5 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.9743120670318604,"_z":16.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x26f t=5 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.9987285137176514,"_z":17.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x270 t=5 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.9405345916748047,"_z":18.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1 e=0x271 t=5 #v={"position":{"_isDirty":true,"_x":19.5,"_y":3.788154125213623,"_z":19.5},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    scene-->>renderer: PUT c=1067 e=0x216 t=5 #v={"originOffset":{"x":0,"y":0,"z":1.100000023841858},"direction":{"$case":"globalTarget","globalTarget":{"x":0.8414709568023682,"y":-1,"z":0.5403022766113281}},"maxDistance":999,"queryType":0,"continuous":true}
    scene-->>renderer: PUT c=1018 e=0x275 t=1 #v={"mesh":{"$case":"sphere","sphere":{}}}
  activate babylon
    babylon-->>renderer: update()
    babylon-->>renderer: lateUpdate()
  deactivate babylon
    renderer-->>scene: PUT c=1 e=0x1 t=6 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1 e=0x2 t=6 #v={"position":{"_isDirty":true,"_x":0,"_y":0,"_z":0},"rotation":{"_isDirty":true,"_x":0,"_y":0,"_z":0,"_w":1},"scale":{"_isDirty":true,"_x":1,"_y":1,"_z":1},"parent":0}
    renderer-->>scene: PUT c=1048 e=0x0 t=6 #v={"frameNumber":5,"totalRuntime":1,"tickNumber":5}
    renderer-->>scene: PUT c=1068 e=0x20b t=5 #v={"timestamp":0,"globalOrigin":{"x":15.481843948364258,"y":7.039275646209717,"z":-0.19572320580482483},"direction":{"x":0.8224282264709473,"y":0.48890915513038635,"z":0.29082587361335754},"hits":[],"tickNumber":5}
    renderer-->>scene: PUT c=1068 e=0x216 t=5 #v={"timestamp":0,"globalOrigin":{"x":11.082706451416016,"y":9.774856567382812,"z":-3.5219240188598633},"direction":{"x":-0.6645640730857849,"y":-0.6991913318634033,"z":0.26360195875167847},"hits":[],"tickNumber":5}
    renderer-->>scene: PUT c=1068 e=0x221 t=5 #v={"timestamp":0,"globalOrigin":{"x":7.36585807800293,"y":6.95431661605835,"z":-7.984397888183594},"direction":{"x":0,"y":-1,"z":0},"hits":[{"position":{"x":7.36585807800293,"y":0.004999999888241291,"z":-7.984397888183594},"globalOrigin":{"x":7.36585807800293,"y":6.95431661605835,"z":-7.984397888183594},"direction":{"x":0,"y":-1,"z":0},"normalHit":{"x":0,"y":1,"z":0},"length":6.949316501617432,"meshName":"box_collider","entityId":513}],"tickNumber":5}
    renderer-->>scene: PUT c=1068 e=0x25c t=5 #v={"timestamp":0,"globalOrigin":{"x":-22,"y":1,"z":-8},"direction":{"x":0,"y":-1,"z":0},"hits":[],"tickNumber":5}
  deactivate renderer
  end
  deactivate scene
```

The file that produced this snapshot was:
```typescript
import { engine, executeTask, Material, Transform } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { initBillboardsScene } from './billboards'
import { initCameraRotation } from './cameraRotation'

import { createCube } from './factory'
import { bounceScalingSystem, circularSystem, RotatorTag, spawnerSystem } from './systems'
import { initRaycastTurrets } from './turrets'

// import { setupUi } from './ui'

// export all the functions required to make the scene work
export * from '@dcl/sdk'

const BouncerComponent = engine.defineComponent("Bouncer", {})

// Defining behavior. See `src/systems.ts` file.
engine.addSystem(circularSystem)
engine.addSystem(spawnerSystem)
engine.addSystem(bounceScalingSystem)

// This function adds some cubes and makes them mimic a wave
executeTask(async function () {
  // Create my main cube and color it.
  const cube = createCube(-2, 1, -2)
  Material.setPbrMaterial(cube, { albedoColor: Color4.create(1.0, 0.0, 0.42) })
  RotatorTag.create(cube)

  for (let x = 0.5; x < 4; x += 1) {
    for (let y = 0.5; y < 4; y += 1) {
      const cube = createCube(x + 16, 0, y + 16, false)
      BouncerComponent.createOrReplace(cube)
    }
  }

  let hoverState: number = 0

  engine.addSystem(function BouncerSystem(dt: number) {
    hoverState += Math.PI * dt * 0.5

    // iterate over the entities of the group
    for (const [entity] of engine.getEntitiesWith(Transform, BouncerComponent)) {
      const transform = Transform.getMutable(entity)

      // mutate the rotation
      transform.position.y =
        Math.cos(hoverState + Math.sqrt(Math.pow(transform.position.x - 8, 2) + Math.pow(transform.position.z - 8, 2)) / Math.PI) * 2 + 2
    }
  })
})

const turretsParent = engine.addEntity()
Transform.create(turretsParent, {
  position: { x: 0, y: 0, z: -16 }
})
initRaycastTurrets(turretsParent)

const billboardParent = engine.addEntity()
Transform.create(billboardParent, {
  position: { x: -16, y: 0, z: -16 }
})
initBillboardsScene(billboardParent)

const cameraRotationParent = engine.addEntity()
Transform.create(cameraRotationParent, {
  position: { x: -32, y: 0, z: -16 }
})
initCameraRotation(cameraRotationParent)
// setupUi()

```