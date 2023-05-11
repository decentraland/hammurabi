import { ReadWriteByteBuffer } from "../../../src/lib/decentraland/ByteBuffer"
import { ComponentDeclaration } from "../../../src/lib/decentraland/crdt-internal/components"
import { createValueSetComponentStore } from "../../../src/lib/decentraland/crdt-internal/grow-only-set"
import { CrdtMessageType, readAllMessages } from "../../../src/lib/decentraland/crdt-wire-protocol"
import { Entity } from "../../../src/lib/decentraland/types"

describe('Conflict resolution rules for GrowOnlyValueSet based components', () => {
  const serde: ComponentDeclaration<{ text: string, timestamp: number }, number> = {
    applyChanges() {},
    componentId: 1,
    deserialize(buffer) {
      return {
        text: buffer.readUtf8String(),
        timestamp: buffer.readFloat64()
      }
    },
    serialize(value, buffer) {
      buffer.writeUtf8String(String(value.text))
      buffer.writeFloat64(value.timestamp)
    },
  }

  const component = createValueSetComponentStore(serde, {
    maxElements: 10,
    timestampFunction(value) {
      return value.timestamp
    }
  })

  afterEach(() => {
    const buffer = new ReadWriteByteBuffer()
    // clear state
    component.dumpCrdtUpdates(buffer)
  })

  it('readonly values', () => {
    expect(component.componentType).toEqual(1)
    expect(component.componentId).toEqual(1)
  })

  it('GET over an unknown entity should return empty set', () => {
    expect(component.get(123 as Entity)).toEqual(new Set())
  })

  it('addValue in unexistent value should create the set', () => {
    const entityId = 0 as Entity

    expect(component.has(entityId)).toEqual(false)

    component.addValue(entityId, {
      text: 'hola',
      timestamp: 1
    })

    expect(component.has(entityId)).toEqual(true)

    expect(Array.from(component.dirtyIterator())).toEqual([entityId])

    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toMatchObject([
      {
        componentId: 1,
        type: CrdtMessageType.APPEND_VALUE,
        timestamp: 0
      }
    ])

    expect(Array.from(component.iterator())).toEqual([
      [
        entityId,
        new Set([
          {
            text: 'hola',
            timestamp: 1
          }
        ])
      ]
    ])
  })

  it('GET over an non-empty entity should return set with values', () => {
    expect(component.get(0 as Entity)).toEqual(
      new Set([
        {
          text: 'hola',
          timestamp: 1
        }
      ])
    )
  })

  it('APPEND should always succeed', () => {
    const entityId = 0 as Entity

    const buf = new ReadWriteByteBuffer()
    const conflictBuffer = new ReadWriteByteBuffer()
    component.declaration.serialize(
      {
        text: 'asd',
        timestamp: 2
      },
      buf
    )

    expect(component.updateFromCrdt({
      componentId: 1,
      data: buf.toBinary(),
      entityId,
      timestamp: 0,
      type: CrdtMessageType.APPEND_VALUE
    }, conflictBuffer)).toBe(true)

    // append operations do not generate a dirty state
    expect(Array.from(component.dirtyIterator())).toEqual([])
    
    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toEqual([])
  })

  it('GET also includes APPEND(ed) message', () => {
    // 1. check both results are there
    // 2. check both results are ordered
    expect(component.get(0 as Entity)).toEqual(
      new Set([
        {
          text: 'hola',
          timestamp: 1
        },
        {
          text: 'asd',
          timestamp: 2
        }
      ])
    )
  })

  it('APPEND unordered must order the elements', () => {
    const entityId = 1 as Entity

    const timestamps = [1, 41, 5, 2, 8, 3, 4, 1, 9, 99]

    for (const timestamp of timestamps) {
      const buf = new ReadWriteByteBuffer()
      const conflictBuffer = new ReadWriteByteBuffer()
      component.declaration.serialize(
        {
          text: timestamps.toString(),
          timestamp
        },
        buf
      )

      component.updateFromCrdt({
        componentId: 1,
        data: buf.toBinary(),
        entityId,
        timestamp: 0,
        type: CrdtMessageType.APPEND_VALUE
      }, conflictBuffer)
    }

    // assert that the result is ordered
    expect(Array.from(component.get(entityId)).map((_) => _.timestamp)).toEqual([1, 1, 2, 3, 4, 5, 8, 9, 41, 99])

    // append operations do not generate a dirty state
    expect(Array.from(component.dirtyIterator())).toEqual([])
    
    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toEqual([])
  })

  it('addValue many times should sort and trim to the max capacity', () => {
    const entityId = 155 as Entity

    const timestamps = [101, 41, 5, 2, 4, 44, 12, 31, 99, 18, 3, 4, 1, 9, 99]

    for (const timestamp of timestamps) {
      component.addValue(entityId, {
        text: timestamp.toString(),
        timestamp
      })
    }

    // assert that the result is ordered
    {
      const results = Array.from(component.get(entityId)).map((_) => _.timestamp)
      expect(results).toHaveLength(10)
      expect(results).toEqual([5, 9, 12, 18, 31, 41, 44, 99, 99, 101])
    }
    // add a value
    component.addValue(entityId, { text: 'hola', timestamp: 100 })

    // check it was appended and then the first element got removed
    {
      const results = Array.from(component.get(entityId)).map((_) => _.timestamp)
      expect(results).toHaveLength(10)
      expect(results).toEqual([9, 12, 18, 31, 41, 44, 99, 99, 100, 101])
    }
  })

  it('APPEND unordered must order the elements, adding extra elements should also remove until the max size is reached', () => {
    const entityId = 1 as Entity

    const timestamps = [1, 41, 5, 2, 4, 44, 12, 31, 99, 18, 3, 4, 1, 9, 99]

    for (const timestamp of timestamps) {
      const buf = new ReadWriteByteBuffer()
      const conflictBuffer = new ReadWriteByteBuffer()
      component.declaration.serialize(
        {
          text: timestamps.toString(),
          timestamp
        },
        buf
      )

      component.updateFromCrdt({
        componentId: 1,
        data: buf.toBinary(),
        entityId,
        timestamp: 0,
        type: CrdtMessageType.APPEND_VALUE
      }, conflictBuffer)
    }

    // assert that the result is ordered
    const results = Array.from(component.get(entityId)).map((_) => _.timestamp)
    expect(results).toHaveLength(10)
    expect(results).toEqual([9, 12, 18, 31, 41, 41, 44, 99, 99, 99])

    // assert that the result is ordered
    {
      const results = Array.from(component.get(entityId)).map((_) => _.timestamp)
      expect(results).toHaveLength(10)
      expect(results).toEqual([9, 12, 18, 31, 41, 41, 44, 99, 99, 99])
    }
    // add a value
    component.addValue(entityId, { text: 'hola', timestamp: 100 })

    // check it was appended and then the first element got removed
    {
      const results = Array.from(component.get(entityId)).map((_) => _.timestamp)
      expect(results).toHaveLength(10)
      expect(results).toEqual([12, 18, 31, 41, 41, 44, 99, 99, 99, 100])
    }

    expect(Array.from(component.dirtyIterator())).toEqual([entityId])

    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toMatchObject([
      {
        componentId: 1,
        type: CrdtMessageType.APPEND_VALUE,
        timestamp: 0,
        entityId
      }
    ])
  })

  it('DELETE an unexistent entity is a noop', () => {
    component.entityDeleted(333 as Entity, false)
  })

  it('DELETE an existent entity clears out its value', () => {
    component.entityDeleted(0 as Entity, false)
    expect(component.get(0 as Entity)).toEqual(new Set([]))
  })

  it('DELETE an existent entity clears out its value', () => {
    component.entityDeleted(0 as Entity, false)
    expect(component.get(0 as Entity)).toEqual(new Set([]))
  })
})

describe('Conflict resolution rules for GrowOnlyValueSet based components with Extended Schema', () => {
  const decl: ComponentDeclaration<{ parent: number }, number> = {
    componentId: 1,
    applyChanges() {},
    deserialize(buffer) {
      return {
        parent: buffer.readFloat64()
      }
    },
    serialize(value, buffer) {
      buffer.writeFloat64(value.parent)
    },
  }

  const component = createValueSetComponentStore(decl, {
    maxElements: 10,
    timestampFunction(value) {
      return value.parent || 0
    }
  })

  it('addValue works with schema.extend', () => {
    const entityId = 0 as Entity

    expect(component.has(entityId)).toEqual(false)

    component.addValue(entityId, { parent: 3 } as any)

    expect(component.has(entityId)).toEqual(true)

    expect(Array.from(component.dirtyIterator())).toEqual([entityId])

    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toMatchObject([
      {
        componentId: 1,
        type: CrdtMessageType.APPEND_VALUE,
        timestamp: 0
      }
    ])

    expect(Array.from(component.iterator())).toEqual([
      [
        entityId,
        new Set([
          {
            parent: 3 as Entity
          }
        ])
      ]
    ])
  })
})

describe('Conflict resolution rules for GrowOnlyValueSet based components with Schema.Int', () => {
  const decl: ComponentDeclaration<number, number> = {
    componentId: 1,
    applyChanges(){},
    deserialize(buffer) {
      return buffer.readFloat64()
    },
    serialize(value, buffer) {
      buffer.writeFloat64(value)
    },
  }

  const component = createValueSetComponentStore(decl, {
    maxElements: 10,
    timestampFunction(value) {
      return value
    }
  })

  it('addValue works with schema', () => {
    const entityId = 0 as Entity

    expect(component.has(entityId)).toEqual(false)

    component.addValue(entityId, 3)

    expect(component.has(entityId)).toEqual(true)

    expect(Array.from(component.dirtyIterator())).toEqual([entityId])

    const outBuf = new ReadWriteByteBuffer()
    component.dumpCrdtUpdates(outBuf)
    expect(Array.from(readAllMessages(outBuf))).toMatchObject([
      {
        componentId: 1,
        type: CrdtMessageType.APPEND_VALUE,
        timestamp: 0
      }
    ])

    expect(Array.from(component.iterator())).toEqual([[entityId, new Set([3])]])
  })
})
