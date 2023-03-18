import { ReadWriteByteBuffer } from '../../../src/lib/decentraland/ByteBuffer'
import { readMessage, AppendValueOperation, CrdtMessageProtocol, CrdtMessageType, CRDT_MESSAGE_HEADER_LENGTH, DeleteComponent, DeleteEntity, PutComponentMessageBody, PutComponentOperation } from '../../../src/lib/decentraland/crdt-wire-protocol'
import { Entity } from '../../../src/lib/decentraland/types'

describe('Component operation tests', () => {
  it('validate corrupt message', () => {
    const buf = new ReadWriteByteBuffer(
      new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]),
      0
    )

    expect(CrdtMessageProtocol.validateFullMessageAvailable(buf)).toBe(false)
    expect(DeleteComponent.read(buf)).toBe(null)
    expect(PutComponentOperation.read(buf)).toBe(null)
    expect(DeleteEntity.read(buf)).toBe(null)
    expect(CrdtMessageProtocol.consumeMessage(buf)).toBe(false)
  })

  it('readMessage should return undefined if it has an invalid header', () => {
    const buf = new ReadWriteByteBuffer()
    expect(readMessage(buf)).toBe(undefined)
    expect(DeleteEntity.read(buf)).toBe(null)

    buf.writeUint32(4567)
    buf.writeUint32(1)
    expect(CrdtMessageProtocol.peekHeader(buf)).toBe(null)
  })

  it('readMessage should return null if the buffer has a valid header with unkown type', () => {
    const buf = new ReadWriteByteBuffer()

    buf.writeUint32(4)
    buf.writeUint32(99)
    expect(CrdtMessageProtocol.peekHeader(buf)).toEqual({ length: 4, type: 99 })
    expect(readMessage(buf)).toBe(null)
  })

  it('appendValue identity test', () => {
    const buf = new ReadWriteByteBuffer()
    AppendValueOperation.write({
      entityId: 1,
      timestamp: 0,
      componentId: 1,
      data: Uint8Array.of(1, 2, 3)
    }, buf)
    const msg = readMessage(buf)

    expect(msg).toEqual({
      componentId: 1,
      data: Uint8Array.of(1, 2, 3),
      entityId: 1,
      length: 27,
      timestamp: 0,
      type: CrdtMessageType.APPEND_VALUE
    })
  })

  it('putComponent identity test', () => {
    const buf = new ReadWriteByteBuffer()
    PutComponentOperation.write({
      entityId: 1,
      timestamp: 3,
      componentId: 1,
      data: Uint8Array.of(1, 2, 3)
    }, buf)
    const msg = readMessage(buf)

    expect(msg).toEqual({
      componentId: 1,
      data: Uint8Array.of(1, 2, 3),
      entityId: 1,
      length: 27,
      timestamp: 3,
      type: CrdtMessageType.PUT_COMPONENT
    })
  })

  it('deleteComponent identity test', () => {
    const buf = new ReadWriteByteBuffer()
    DeleteComponent.write({
      entityId: 1,
      timestamp: 3,
      componentId: 2,
    }, buf)
    const msg = readMessage(buf)

    expect(msg).toEqual({
      componentId: 2,
      entityId: 1,
      length: 20,
      timestamp: 3,
      type: CrdtMessageType.DELETE_COMPONENT
    })
  })

  it('deleteEntity identity test', () => {
    const buf = new ReadWriteByteBuffer()
    DeleteEntity.write({ entityId: 1 }, buf)
    const msg = readMessage(buf)

    expect(msg).toEqual({
      entityId: 1,
      length: 12,
      type: CrdtMessageType.DELETE_ENTITY
    })
  })

  it('should fail null if it has an invalid type', () => {
    const buf = new ReadWriteByteBuffer()

    function writeSomeInvalidMessage() {
      buf.writeUint32(8)
      buf.writeUint32(213)
    }

    writeSomeInvalidMessage()
    expect(() => {
      PutComponentOperation.read(buf)
    }).toThrowError()

    writeSomeInvalidMessage()
    expect(() => {
      DeleteEntity.read(buf)
    }).toThrowError()

    writeSomeInvalidMessage()
    expect(() => {
      DeleteComponent.read(buf)
    }).toThrowError()

    writeSomeInvalidMessage()
    expect(() => {
      DeleteComponent.read(buf)
    }).toThrowError()

    writeSomeInvalidMessage()
    expect(readMessage(buf)).toBeNull()

    // the header has to be read
    expect(CrdtMessageProtocol.readHeader(buf)).not.toBeNull()

    buf.writeUint32(12)
    buf.writeUint32(213)
    buf.writeUint32(22)
    expect(buf.remainingBytes()).toBe(12)
    expect(CrdtMessageProtocol.consumeMessage(buf)).toBe(true)
    expect(buf.remainingBytes()).toBe(0)
  })
})
