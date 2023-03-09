import { Quaternion, Vector3 } from "@babylonjs/core"
import { BabylonEntity } from "../../../../src/lib/babylon/scene/entity"
import { ReadWriteByteBuffer } from "../../../../src/lib/decentraland/ByteBuffer"
import { CrdtMessageType, readMessage } from "../../../../src/lib/decentraland/crdt-wire-protocol"
import { Transform, transformSerde, TRANSFORM_COMPONENT_ID } from "../../../../src/lib/decentraland/sdk-components/transform"
import { Entity } from "../../../../src/lib/decentraland/types"
import { CrdtBuilder, initTestEngine } from "../babylon-test-helper"

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

    const transform: Transform = { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: 0 }

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
        .put(TRANSFORM_COMPONENT_ID, entityA, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: 0 })
        .put(TRANSFORM_COMPONENT_ID, entityB, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityA })
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityB })
        .put(TRANSFORM_COMPONENT_ID, entityD, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityC })
        .put(TRANSFORM_COMPONENT_ID, entityE, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityD })
        .put(TRANSFORM_COMPONENT_ID, entityF, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityE })
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
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityA })
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
        .put(TRANSFORM_COMPONENT_ID, entityD, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityC })
        .put(TRANSFORM_COMPONENT_ID, entityE, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityD })
        .put(TRANSFORM_COMPONENT_ID, entityF, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityE })
        .toBinary()
    })

    expect(Array.from(dumpTree($.ctx.rootNode))).toEqual([
      "0",
      "└──D",
      "   └──E",
      "      └──F",
    ])
  })

  test('then create the missing entityC', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entityC, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityB })
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

  test('then create the rest', async () => {
    // act, sending the CRDT update to the engine and waiting for the frame to process
    await $.ctx.crdtSendToRenderer({
      data: new CrdtBuilder()
        .put(TRANSFORM_COMPONENT_ID, entityA, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: 0 })
        .put(TRANSFORM_COMPONENT_ID, entityB, ++timestamp, transformSerde,
          { position: Vector3.One().scaleInPlace(3), scale: Vector3.One().scaleInPlace(2), rotation: Quaternion.Identity(), parent: entityA })
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

export function* dumpTree(entity: BabylonEntity, depth: number = 0) {
  yield '   '.repeat(Math.max(depth - 1, 0)) + (depth ? "└──" : '') + entity.entityId.toString(16).toUpperCase()
  for (const child of entity.childrenEntities()) {
    yield* dumpTree(child, depth + 1)
  }
}