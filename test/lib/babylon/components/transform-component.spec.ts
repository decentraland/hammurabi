import { Quaternion, Vector3 } from "@babylonjs/core"
import { Transform, transformComponent } from "../../../../src/lib/decentraland/sdk-components/transform-component"
import { BabylonEntity } from "../../../../src/lib/babylon/scene/BabylonEntity"
import { ReadWriteByteBuffer } from "../../../../src/lib/decentraland/ByteBuffer"
import { CrdtMessageType, readMessage } from "../../../../src/lib/decentraland/crdt-wire-protocol"
import { Entity } from "../../../../src/lib/decentraland/types"
import { CrdtBuilder, testWithEngine } from "../babylon-test-helper"
import { permute } from "../permutation-helper"
import { Scene } from "@dcl/schemas"

const baseTransform: Transform = { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: 0 as Entity }

const TRANSFORM_COMPONENT_ID = transformComponent.componentId


testWithEngine("transform component compliance tests", {
  baseUrl: '/',
  entity: { content: [], metadata: {} as Scene, type: 'scene' },
  urn: '123'
}, ($) => {
  const entity = 600 as Entity
  let timestamp = 0

  beforeEach(() => $.startEngine())

  test('put a transform should create the entity and correctly reflect it on the entity\'s transform', async () => {
    // before processing the message, the entity doesn't exist
    expect($.ctx.entities.has(entity)).toBeFalsy()

    const transform: Transform = { ...baseTransform, parent: 0 }

    // act, sending the CRDT update to the engine and waiting for the frame to process
    const { data } = await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entity, ++timestamp, transform)
        .finish()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    babylonEntity.computeWorldMatrix(true)
    expect(babylonEntity).toBeTruthy()
    // and it has a transform component
    expect(babylonEntity.usedComponents.has(TRANSFORM_COMPONENT_ID)).toBeTruthy()
    // assert that the provided values are now reflected on the entity
    transform.position._isDirty = false
    transform.scale._isDirty = false
    transform.rotation._isDirty = false
    expect(babylonEntity.position).toEqual(transform.position)
    expect(babylonEntity.scaling).toEqual(transform.scale)
    expect(babylonEntity.rotationQuaternion).toEqual(transform.rotation)
  })

  test('put a transform with greater timestamp should update the entity values', async () => {
    // the entity should exist in order to update it
    expect($.ctx.entities.has(entity)).toBeTruthy()

    const transform: Transform = { position: Vector3.One().scaleInPlace(1), scale: Vector3.One().scaleInPlace(55), rotation: Quaternion.Identity(), parent: 0 }

    // act, sending the CRDT update to the engine and waiting for the frame to process
    const { data } = await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entity, ++timestamp, transform)
        .finish()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
    babylonEntity.computeWorldMatrix(true)
    // assert that the provided values are now reflected on the entity
    transform.position._isDirty = false
    transform.scale._isDirty = false
    transform.rotation._isDirty = false
    expect(babylonEntity.position).toEqual(transform.position)
    expect(babylonEntity.scaling).toEqual(transform.scale)
    expect(babylonEntity.rotationQuaternion).toEqual(transform.rotation)
  })

  test('receiving same timestamp message with different data should produce a conflict resolution message', async () => {
    // the entity should exist in order to update it
    expect($.ctx.entities.has(entity)).toBeTruthy()

    // act, sending the CRDT update to the engine and waiting for the frame to process
    const { data } = await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .delete(transformComponent, entity, timestamp)
        .finish()
    })

    // here is our conflict resolution message
    expect(data.length).toEqual(1)
    // saying the entity was not deleted, because PUT wins over DELETE
    const buf = new ReadWriteByteBuffer(data[0])
    expect(readMessage(buf)).toMatchObject({
      componentId: TRANSFORM_COMPONENT_ID,
      entityId: 600,
      length: 68,
      timestamp: 2,
      type: CrdtMessageType.PUT_COMPONENT
    })
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
  })

  test('removing a component should take the transform values back to Transform.Identity', async () => {
    // the entity should exist in order to update it
    expect($.ctx.entities.has(entity)).toBeTruthy()

    const identityTransform: Transform = { position: Vector3.Zero(), scale: Vector3.One(), rotation: Quaternion.Identity(), parent: 0 }

    // act, sending the CRDT update to the engine and waiting for the frame to process
    const { data } = await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .delete(transformComponent, entity, ++timestamp)
        .finish()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
    babylonEntity.computeWorldMatrix(true)
    // assert that the provided values are now reflected on the entity
    identityTransform.position._isDirty = false
    identityTransform.scale._isDirty = false
    identityTransform.rotation._isDirty = false
    expect(babylonEntity.position).toEqual(identityTransform.position)
    expect(babylonEntity.scaling).toEqual(identityTransform.scale)
    expect(babylonEntity.rotationQuaternion).toEqual(identityTransform.rotation)
  })
})


testWithEngine("reparenting compliance tests, remove one node from the middle of the chain", {
  baseUrl: '/',
  entity: { content: [], metadata: {} as Scene, type: 'scene' },
  urn: '123'
}, ($) => {
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  beforeEach(() => $.startEngine())

  test('first create all entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityA, ++timestamp, { ...baseTransform, parent: 0 })
        .put(transformComponent, entityB, ++timestamp, { ...baseTransform, parent: entityA })
        .put(transformComponent, entityC, ++timestamp, { ...baseTransform, parent: entityB })
        .put(transformComponent, entityD, ++timestamp, { ...baseTransform, parent: entityC })
        .put(transformComponent, entityE, ++timestamp, { ...baseTransform, parent: entityD })
        .put(transformComponent, entityF, ++timestamp, { ...baseTransform, parent: entityE })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "      └──C",
      "         └──D",
      "            └──E",
      "               └──F",
    ])
  })

  test('reparent C to A', async () => {
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityC, ++timestamp,
          { ...baseTransform, parent: entityA })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "   └──C",
      "      └──D",
      "         └──E",
      "            └──F",
    ])
  })

  test('remove transform from C means it will be reparented to the root entity', async () => {
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .delete(transformComponent, entityC, ++timestamp)
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "└──C",
      "   └──D",
      "      └──E",
      "         └──F",
    ])
  })
})


testWithEngine("reparenting compliance tests, parent to an unexistent entity uses the root transform", {
  baseUrl: '/',
  entity: { content: [], metadata: {} as Scene, type: 'scene' },
  urn: '123'
}, ($) => {
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  beforeEach(() => $.startEngine())

  test('first create the tailing entities, not attached to existing entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityD, ++timestamp, { ...baseTransform, parent: entityC })
        .put(transformComponent, entityE, ++timestamp, { ...baseTransform, parent: entityD })
        .put(transformComponent, entityF, ++timestamp, { ...baseTransform, parent: entityE })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──C",
      "   └──D",
      "      └──E",
      "         └──F",
    ])
  })

  test('then create the missing entityC', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityC, ++timestamp, { ...baseTransform, parent: entityB })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──B",
      "   └──C",
      "      └──D",
      "         └──E",
      "            └──F",
    ])
  })

  test('then create the rest', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityA, ++timestamp, { ...baseTransform, parent: 0 })
        .put(transformComponent, entityB, ++timestamp, { ...baseTransform, parent: entityA })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "      └──C",
      "         └──D",
      "            └──E",
      "               └──F",
    ])
  })
})

testWithEngine("reparenting compliance tests, remove one node from the middle of the chain", {
  baseUrl: '/',
  entity: { content: [], metadata: {} as Scene, type: 'scene' },
  urn: '123'
}, ($) => {
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  beforeEach(() => $.startEngine())

  test('first create all entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityA, ++timestamp, { ...baseTransform, parent: 0 })
        .put(transformComponent, entityB, ++timestamp, { ...baseTransform, parent: entityA })
        .put(transformComponent, entityC, ++timestamp, { ...baseTransform, parent: entityB })
        .put(transformComponent, entityD, ++timestamp, { ...baseTransform, parent: entityC })
        .put(transformComponent, entityE, ++timestamp, { ...baseTransform, parent: entityD })
        .put(transformComponent, entityF, ++timestamp, { ...baseTransform, parent: entityE })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "      └──C",
      "         └──D",
      "            └──E",
      "               └──F",
    ])
  })

  test('reparent C to A', async () => {
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(transformComponent, entityC, ++timestamp,
          { ...baseTransform, parent: entityA })
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "   └──C",
      "      └──D",
      "         └──E",
      "            └──F",
    ])
  })

  test('remove transform from C means it will be reparented to the root entity', async () => {
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .delete(transformComponent, entityC, ++timestamp)
        .finish()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──A",
      "   └──B",
      "└──C",
      "   └──D",
      "      └──E",
      "         └──F",
    ])
  })
})

function parseParentingCommand(command: string) {
  const re = /^timestamp=(\d+)\s+entity=(\d+) parent=(\d+)/i
  const results = command.match(re)
  return {
    timestamp: +results[1],
    entity: +results[2],
    parent: +results[3]
  }
}


// Each sequence uses a fresh CRDT, the key is the operation and the value of the map is the partial resultin tree
const sequences = [
  {
    "timestamp=4 entity=3 parent=0": [
      "0",
      "└──3"
    ],
    "timestamp=1 entity=3 parent=1": [ // this one should be ignored because of the former
      "0",
      "└──3",
    ],
    "timestamp=3 entity=2 parent=3": [ // this one should create the 2 entity
      "0",
      "└──3",
      "   └──2",
    ],
    "timestamp=2 entity=1 parent=2": [
      "0",
      "└──3",
      "   └──2",
      "      └──1",
    ],
  },
  {
    "timestamp=1 entity=1 parent=1": [ // entity parenting to itself
      "0",
      "└──1"
    ],
    "timestamp=2 entity=2 parent=1": [
      "0",
      "└──1",
      "   └──2",
    ],
    "timestamp=3 entity=1 parent=2": [ // try to make a loop 1->2->1
      "0",
      "└──1",
      "   └──2",
    ],
    "timestamp=4 entity=1 parent=3": [
      "0",
      "└──3",
      "   └──1",
      "      └──2",
    ],
    "timestamp=5 entity=0 parent=1": [ // parent ing of entity 0 must be skipped
      "0",
      "└──3",
      "   └──1",
      "      └──2",
    ],
  }
]

let seqid = 1
for (const test of sequences) {

  testWithEngine("test final result, single CRDT message with all messages " + seqid++, {
    baseUrl: '/',
    entity: { content: [], metadata: {} as Scene, type: 'scene' },
    urn: '123'
  }, ($) => {
    beforeEach(() => $.startEngine())

    Object.entries(test).forEach(([step, state]) => {
      const _ = parseParentingCommand(step)
      it(step, async () => {
        // act, process one by one the messages
        await $.ctx.crdtSendToRenderer({
          data: new CrdtBuilder()
            .put(transformComponent, _.entity, _.timestamp, { ...baseTransform, parent: _.parent })
            .finish()
        })

        // the final state is always the same
        expect(Array.from(dumpTree($.ctx.rootNode))).toEqual(state)
      })
    })
  })
}
describe('cyclic recovery with permutations', () => {
  const messages = [
    "timestamp=1 entity=3 parent=1",
    "timestamp=2 entity=1 parent=2",
    "timestamp=3 entity=2 parent=3",
    "timestamp=4 entity=3 parent=0",
  ]

  // find all possible permutations
  const permutations = Array.from(permute(messages)).map($ => ({ cases: $ }))

  describe.each(permutations)("test final result, single CRDT message with all messages", (permutation) => {
    testWithEngine("test final result, single CRDT message with all messages " + seqid++, {
      baseUrl: '/',
      entity: { content: [], metadata: {} as Scene, type: 'scene' },
      urn: '123'
    }, ($) => {
      beforeEach(() => $.startEngine())
      test(`do the test in order ${permutation.cases}`, async () => {
        const builder = new CrdtBuilder()

        // schedule all the shuffled messages in one single CRDT update
        for (const step of permutation.cases) {
          const _ = parseParentingCommand(step)
          builder.put(transformComponent, _.entity, _.timestamp, { ...baseTransform, parent: _.parent })
        }

        // act
        await $.ctx.crdtSendToRenderer({
          data: builder.finish()
        })

        expect($.ctx.hierarchyChanged).toEqual(false)
        expect($.ctx.unparentedEntities.size).toEqual(0)

        // the final state is always the same
        expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
          "0",
          "└──3",
          "   └──2",
          "      └──1",
        ])
      })
    })
  })

  describe.each(permutations)("test cyclic reference recovery, sending one update per frame", (permutation) => {
    testWithEngine('cyclic recovery with permutations', {
      baseUrl: '/',
      entity: { content: [], metadata: {} as Scene, type: 'scene' },
      urn: '123'
    }, ($) => {
      beforeEach(() => $.startEngine())
      test(`do the test in order ${permutation.cases}`, async () => {
        // act, process one by one the messages
        for (const step of permutation.cases) {
          const _ = parseParentingCommand(step)
          await $.ctx.crdtSendToRenderer({
            data: new CrdtBuilder()
              .put(transformComponent, _.entity, _.timestamp, { ...baseTransform, parent: _.parent })
              .finish()
          })
        }

        // there must be zero offenders
        expect($.ctx.hierarchyChanged).toEqual(false)
        expect($.ctx.unparentedEntities.size).toEqual(0)

        // the final state is always the same
        expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
          "0",
          "└──3",
          "   └──2",
          "      └──1",
        ])
      })
    })
  })
})
export function* dumpTree(entity: BabylonEntity, depth: number = 0) {
  yield '   '.repeat(Math.max(depth - 1, 0)) + (depth ? "└──" : '') + entity.entityId.toString(16).toUpperCase()
  for (const child of entity.childrenEntities()) {
    yield* dumpTree(child, depth + 1)
  }
}