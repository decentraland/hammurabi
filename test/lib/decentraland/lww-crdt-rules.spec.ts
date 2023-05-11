import { ByteBuffer, ReadWriteByteBuffer } from "../../../src/lib/decentraland/ByteBuffer"
import { CrdtMessageType, readAllMessages, readMessage } from "../../../src/lib/decentraland/crdt-wire-protocol"
import { createLwwStore, createUpdateLwwFromCrdt } from "../../../src/lib/decentraland/crdt-internal/last-write-win-element-set"
import { Entity } from "../../../src/lib/decentraland/types"
import { ComponentDeclaration } from "../../../src/lib/decentraland/crdt-internal/components"
import { prettyPrintCrdtMessage } from "../../../src/lib/decentraland/crdt-wire-protocol/prettyPrint"

describe('Conflict resolution rules for LWW-ElementSet based components', () => {
  const schema = {
    serialize(value: number, builder: ByteBuffer) {
      builder.writeInt8(value)
    },
    deserialize(reader: ByteBuffer) {
      return reader.readInt8()
    }
  }
  const componentId = 1
  const timestamps = new Map<Entity, number>()
  const data = new Map<Entity, number>()

  const updateFn = createUpdateLwwFromCrdt(componentId, timestamps, schema, data)

  it('PUT an unexistent value should succeed', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(1),
      entityId,
      timestamp: 0,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(1)
    expect(timestamps.get(entityId)).toEqual(0)
  })

  it('PUT the same value and timestamp should be idempotent', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(1),
      entityId,
      timestamp: 0,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(1)
    expect(timestamps.get(entityId)).toEqual(0)
  })

  it('PUT a newer (timestamp) value should accept it', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(1),
      entityId,
      timestamp: 1,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(1)
    expect(timestamps.get(entityId)).toEqual(1)
  })

  it('PUT an older (timestamp) value should reject the change and return a "correction" message', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(1),
      entityId,
      timestamp: 0,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(readMessage(conflictBuffer)).toMatchObject({
      componentId,
      entityId,
      data: Uint8Array.of(1),
      timestamp: 1,
      type: CrdtMessageType.PUT_COMPONENT
    })

    // state assertions
    expect(data.get(entityId)).toEqual(1)
    expect(timestamps.get(entityId)).toEqual(1)
  })

  it('PUT a conflicting timestamp with higher value should accept the higher value', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(2),
      entityId,
      timestamp: 1,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(2)
    expect(timestamps.get(entityId)).toEqual(1)
  })

  it('DELETE a conflicting timestamp should keep the value and return a correction message', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      timestamp: 1,
      type: CrdtMessageType.DELETE_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(readMessage(conflictBuffer)).toEqual({
      componentId,
      data: Uint8Array.of(2),
      entityId,
      length: 25,
      timestamp: 1,
      type: CrdtMessageType.PUT_COMPONENT
    })

    // state assertions
    expect(data.get(entityId)).toEqual(2)
    expect(timestamps.get(entityId)).toEqual(1)
  })

  it('DELETE with a new timestamp should succeed', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      timestamp: 3,
      type: CrdtMessageType.DELETE_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(undefined)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('DELETE is idempotent', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      timestamp: 3,
      type: CrdtMessageType.DELETE_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(undefined)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('PUT an old timestamp should return a DELETE correction message', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      data: Uint8Array.of(2),
      entityId,
      timestamp: 0,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(readMessage(conflictBuffer)).toEqual({
      componentId,
      entityId,
      length: 20,
      timestamp: 3,
      type: CrdtMessageType.DELETE_COMPONENT
    })

    // state assertions
    expect(data.get(entityId)).toEqual(undefined)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('PUT using the same timestamp as the delete should be accepted', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      data: Uint8Array.of(10),
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(10)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('PUT is idempotent', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      data: Uint8Array.of(10),
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(true)

    // state assertions
    expect(data.get(entityId)).toEqual(10)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('PUT in case of null data it keeps the current state and returns correction message', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      data: null as any,
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(updateAccepted).toEqual(false)
    expect(readMessage(conflictBuffer)).toEqual({
      componentId,
      entityId,
      length: 25,
      data: Uint8Array.of(10),
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    })

    // state assertions
    expect(data.get(entityId)).toEqual(10)
    expect(timestamps.get(entityId)).toEqual(3)
  })

  it('PUT in case of empty data returns a correction message', () => {
    const entityId = 0 as Entity
    const conflictBuffer = new ReadWriteByteBuffer()

    const updateAccepted = updateFn({
      componentId,
      entityId,
      data: new Uint8Array(),
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    }, conflictBuffer)

    // result assertions
    expect(readMessage(conflictBuffer)).toEqual({
      componentId,
      entityId,
      length: 25,
      data: Uint8Array.of(10),
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    })

    // state assertions
    expect(data.get(entityId)).toEqual(10)
    expect(timestamps.get(entityId)).toEqual(3)
  })
})

describe('integration lww', () => {
  const decl: ComponentDeclaration<{ u8: number }, number> = {
    componentId: 1,
    applyChanges() { },
    serialize(value, builder: ByteBuffer) {
      builder.writeInt8(value.u8)
    },
    deserialize(reader: ByteBuffer) {
      return { u8: reader.readInt8() }
    }
  }

  const component = createLwwStore(decl)

  function assertCrdtUpdates(...expected: string[]) {
    const buf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(buf)
    expect(Array.from(readAllMessages(buf)).map(_ => prettyPrintCrdtMessage(_))).toEqual(expected)
  }

  afterEach(() => {
    const buf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(buf)
    const updates = Array.from(readAllMessages(buf)).map(_ => prettyPrintCrdtMessage(_))
    if (updates.length) throw new Error('Some CRDT updates were not asserted:\n' + updates.join('\n'))
  })

  it('create and createOrReplace', () => {
    const entity = 1 as Entity
    expect(component.has(entity)).toBe(false)
    component.create(entity, { u8: 1 })
    expect(component.has(entity)).toBe(true)
    expect(component.get(entity)).toEqual({ u8: 1 })

    assertCrdtUpdates('PUT c=1 e=0x1 t=1 #v=byte[1]')

    expect(() => component.create(entity, { u8: 1 })).toThrow()
    component.createOrReplace(entity, { u8: 2 })
    expect(component.get(entity)).toEqual({ u8: 2 })

    assertCrdtUpdates('PUT c=1 e=0x1 t=2 #v=byte[1]')
  })

  it('unexistent returns undefined', () => {
    const entity = 199 as Entity
    expect(component.get(entity)).toBeUndefined()
  })

  it('deleteFrom', () => {
    const entity = 22 as Entity
    component.createOrReplace(entity, { u8: 2 })
    expect(component.has(entity)).toBe(true)
    expect(component.deleteFrom(entity)).toEqual({ u8: 2 })
    expect(component.has(entity)).toBe(false)

    assertCrdtUpdates('DELETE_COMPONENT c=1 e=0x16 t=1')
  })

  it('deleteEntity', () => {
    const entity = 222 as Entity
    component.createOrReplace(entity, { u8: 2 })
    expect(component.has(entity)).toBe(true)
    component.entityDeleted(entity, true)
    expect(component.has(entity)).toBe(false)

    const [dirtyEntity] = component.dirtyIterator()
    expect(dirtyEntity).toEqual(entity)

    assertCrdtUpdates('DELETE_COMPONENT c=1 e=0xde t=1')
  })
})