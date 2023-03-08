import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { DeleteEntity, PutComponentOperation } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { Entity } from '../../../src/lib/decentraland/types'
import { initTestEngine } from './babylon-test-helper'

describe("entities are removed on scene disposal", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })

  test('create an extra entity that will be deleted upon context disposal', async () => {
    const entityId = 2 as Entity

    // first there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)

    // then we create a component for the entityId=1
    {
      const buf = new ReadWriteByteBuffer()
      PutComponentOperation.write(entityId, 1 /* timestamp */, 1 /* componentId */, Uint8Array.of(1, 2, 3), buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // then there is an entity
    expect($.ctx.entities.has(entityId)).toEqual(true)
    const entityDisposeSpy = jest.spyOn($.ctx.entities.get(entityId), 'dispose')

    // dispose the entire scene context
    $.ctx?.dispose()

    // and the entity should not exist anymore
    expect($.ctx.entities.has(entityId)).toEqual(false)
    expect(entityDisposeSpy).toHaveBeenCalled()
  })
})

describe("scene context implents ADR-148", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })

  it('tests one empty update', async () => {
    const result = await $.ctx.crdtSendToRenderer({ data: Uint8Array.of() })
    expect(result).toEqual({ data: [] })
  })

  it('tests one message with a blank entity component', async () => {
    const entityId = 1 as Entity

    // first there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)

    // then we create a component for the entityId=1
    {
      const buf = new ReadWriteByteBuffer()
      PutComponentOperation.write(entityId, 1 /* timestamp */, 1 /* componentId */, Uint8Array.of(1, 2, 3), buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // then there is an entity
    expect($.ctx.entities.has(entityId)).toEqual(true)

    // then we delete the entity
    {
      const buf = new ReadWriteByteBuffer()
      DeleteEntity.write(entityId, buf)
      const result = await $.ctx.crdtSendToRenderer({ data: buf.toBinary() })
      expect(result).toEqual({ data: [] })
    }

    // and then there is no entity
    expect($.ctx.entities.has(entityId)).toEqual(false)
  })
})


describe("outgoingMessages are delivered on crdtSendToRenderer result", () => {
  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123'
  })

  test('writing to outgoingMessagesBuffer redirects reaches crdtSendToRenderer', async () => {
    const entityId = 2 as Entity

    // write an outgoing message to the scene's buffer
    PutComponentOperation.write(entityId, 1 /* timestamp */, 1 /* componentId */, Uint8Array.of(1, 2, 3), $.ctx.outgoingMessagesBuffer)

    // then call crdtSendToRenderer
    const expectedResult = $.ctx.outgoingMessagesBuffer.toBinary()
    const result = await $.ctx.crdtSendToRenderer({ data: Uint8Array.of() })
    expect(result).toEqual({ data: [expectedResult] })

    // and the buffer's writing head should be reset
    expect($.ctx.outgoingMessagesBuffer.currentWriteOffset()).toEqual(0)
  })

  test('outgoingMessagesBuffer should be empty after the first time', async () => {
    const result = await $.ctx.crdtSendToRenderer({ data: Uint8Array.of() })
    expect(result).toEqual({ data: [] })
  })
})
