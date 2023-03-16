import { Quaternion, Vector3 } from "@babylonjs/core"
import { Transform, transformSerde, TRANSFORM_COMPONENT_ID } from "../../../../src/lib/decentraland/sdk-components/transform-component"
import { BabylonEntity } from "../../../../src/lib/babylon/scene/entity"
import { ReadWriteByteBuffer } from "../../../../src/lib/decentraland/ByteBuffer"
import { CrdtMessageType, readMessage } from "../../../../src/lib/decentraland/crdt-wire-protocol"
import { Entity } from "../../../../src/lib/decentraland/types"
import { CrdtBuilder, initTestEngine } from "../babylon-test-helper"
import { permute } from "../permutation-helper"

const baseTransform: Transform = { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: 0 as Entity }

describe("transform component compliance tests", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })
  const entity = 600 as Entity
  let timestamp = 0

  test('put a transform should create the entity and correctly reflect it on the entity\'s transform', async () => {
    // before processing the message, the entity doesn't exist
    expect($.ctx.entities.has(entity)).toBeFalsy()

    const transform: Transform = { ...baseTransform, parent: 0 }

    // act, sending the CRDT update to the engine and waiting for the frame to process
    const { data } = await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entity, ++timestamp, transformSerde, transform)
        .toBinary()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
    // and it has a transform component
    expect(babylonEntity.usedComponents.has(TRANSFORM_COMPONENT_ID)).toBeTruthy()
    // assert that the provided values are now reflected on the entity
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
        .put(TRANSFORM_COMPONENT_ID, entity, ++timestamp, transformSerde, transform)
        .toBinary()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
    // assert that the provided values are now reflected on the entity
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
        .delete(TRANSFORM_COMPONENT_ID, entity, timestamp)
        .toBinary()
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
        .delete(TRANSFORM_COMPONENT_ID, entity, ++timestamp)
        .toBinary()
    })

    // since there are not conflicts, we do not receive any updates from the engine
    expect(data).toEqual([])
    // the entity now exists
    const babylonEntity = $.ctx.entities.get(entity)
    expect(babylonEntity).toBeTruthy()
    // assert that the provided values are now reflected on the entity
    expect(babylonEntity.position).toEqual(identityTransform.position)
    expect(babylonEntity.scaling).toEqual(identityTransform.scale)
    expect(babylonEntity.rotationQuaternion).toEqual(identityTransform.rotation)
  })
})

describe("reparenting compliance tests, remove one node from the middle of the chain", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  test('first create all entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entityA, ++timestamp, transformSerde, { ...baseTransform, parent: 0 })
        .put(TRANSFORM_COMPONENT_ID, entityB, ++timestamp, transformSerde, { ...baseTransform, parent: entityA })
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde, { ...baseTransform, parent: entityB })
        .put(TRANSFORM_COMPONENT_ID, entityD, ++timestamp, transformSerde, { ...baseTransform, parent: entityC })
        .put(TRANSFORM_COMPONENT_ID, entityE, ++timestamp, transformSerde, { ...baseTransform, parent: entityD })
        .put(TRANSFORM_COMPONENT_ID, entityF, ++timestamp, transformSerde, { ...baseTransform, parent: entityE })
        .toBinary()
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
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde,
          { ...baseTransform, parent: entityA })
        .toBinary()
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
        .delete(TRANSFORM_COMPONENT_ID, entityC, ++timestamp)
        .toBinary()
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

describe("reparenting compliance tests, parent to an unexistent entity uses the root transform", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  test('first create the tailing entities, not attached to existing entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entityD, ++timestamp, transformSerde, { ...baseTransform, parent: entityC })
        .put(TRANSFORM_COMPONENT_ID, entityE, ++timestamp, transformSerde, { ...baseTransform, parent: entityD })
        .put(TRANSFORM_COMPONENT_ID, entityF, ++timestamp, transformSerde, { ...baseTransform, parent: entityE })
        .toBinary()
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
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde, { ...baseTransform, parent: entityB })
        .toBinary()
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
        .put(TRANSFORM_COMPONENT_ID, entityA, ++timestamp, transformSerde, { ...baseTransform, parent: 0 })
        .put(TRANSFORM_COMPONENT_ID, entityB, ++timestamp, transformSerde, { ...baseTransform, parent: entityA })
        .toBinary()
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


describe("reparenting compliance tests, remove one node from the middle of the chain", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })
  const entityA = 0xA as Entity
  const entityB = 0xB as Entity
  const entityC = 0xC as Entity
  const entityD = 0xD as Entity
  const entityE = 0xE as Entity
  const entityF = 0xF as Entity

  let timestamp = 0

  test('first create all entities', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entityA, ++timestamp, transformSerde, { ...baseTransform, parent: 0 })
        .put(TRANSFORM_COMPONENT_ID, entityB, ++timestamp, transformSerde, { ...baseTransform, parent: entityA })
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde, { ...baseTransform, parent: entityB })
        .put(TRANSFORM_COMPONENT_ID, entityD, ++timestamp, transformSerde, { ...baseTransform, parent: entityC })
        .put(TRANSFORM_COMPONENT_ID, entityE, ++timestamp, transformSerde, { ...baseTransform, parent: entityD })
        .put(TRANSFORM_COMPONENT_ID, entityF, ++timestamp, transformSerde, { ...baseTransform, parent: entityE })
        .toBinary()
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
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde,
          { ...baseTransform, parent: entityA })
        .toBinary()
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
        .delete(TRANSFORM_COMPONENT_ID, entityC, ++timestamp)
        .toBinary()
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

describe('manual cyclic cases', () => {
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
    describe("test final result, single CRDT message with all messages " + seqid++, () => {
      const $ = initTestEngine({
        baseUrl: '/',
        entity: { content: [], metadata: {} },
        id: '123'
      })

      Object.entries(test).forEach(([step, state]) => {
        const _ = parseParentingCommand(step)
        it(step, async () => {
          // act, process one by one the messages
          await $.ctx.crdtSendToRenderer({
            data: new CrdtBuilder()
              .put(TRANSFORM_COMPONENT_ID, _.entity, _.timestamp, transformSerde, { ...baseTransform, parent: _.parent })
              .toBinary()
          })

          // the final state is always the same
          expect(Array.from(dumpTree($.ctx.rootNode))).toEqual(state)
        })
      })
    })
  }
})

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
    const $ = initTestEngine({
      baseUrl: '/',
      entity: { content: [], metadata: {} },
      id: '123'
    })

    test(`do the test in order ${permutation.cases}`, async () => {
      const builder = new CrdtBuilder()

      // schedule all the shuffled messages in one single CRDT update
      for (const step of permutation.cases) {
        const _ = parseParentingCommand(step)
        builder.put(TRANSFORM_COMPONENT_ID, _.entity, _.timestamp, transformSerde, { ...baseTransform, parent: _.parent })
      }

      // act
      await $.ctx.crdtSendToRenderer({
        data: builder.toBinary()
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

  describe.each(permutations)("test cyclic reference recovery, sending one update per frame", (permutation) => {
    const $ = initTestEngine({
      baseUrl: '/',
      entity: { content: [], metadata: {} },
      id: '123'
    })

    test(`do the test in order ${permutation.cases}`, async () => {
      // act, process one by one the messages
      for (const step of permutation.cases) {
        const _ = parseParentingCommand(step)
        await $.ctx.crdtSendToRenderer({
          data: new CrdtBuilder()
            .put(TRANSFORM_COMPONENT_ID, _.entity, _.timestamp, transformSerde, { ...baseTransform, parent: _.parent })
            .toBinary()
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


export function* dumpTree(entity: BabylonEntity, depth: number = 0) {
  yield '   '.repeat(Math.max(depth - 1, 0)) + (depth ? "└──" : '') + entity.entityId.toString(16).toUpperCase()
  for (const child of entity.childrenEntities()) {
    yield* dumpTree(child, depth + 1)
  }
}