import { CrdtMessageProtocol } from './crdtMessageProtocol'
import { ByteBuffer } from '../ByteBuffer'
import { AppendValueMessage, CrdtMessageType, CRDT_MESSAGE_HEADER_LENGTH } from './types'
import { Entity } from '../types'

/**
 * @public
 */
export namespace AppendValueOperation {
  export const MESSAGE_HEADER_LENGTH = 16

  /**
   * Call this function for an optimal writing data passing the ByteBuffer
   *  already allocated
   */
  export function write(entity: Entity, timestamp: number, componentId: number, data: Uint8Array, buf: ByteBuffer) {
    const messageLength = CRDT_MESSAGE_HEADER_LENGTH + MESSAGE_HEADER_LENGTH + data.byteLength

    // Write CrdtMessage header
    buf.writeUint32(messageLength)
    buf.writeUint32(CrdtMessageType.APPEND_VALUE)

    // Write ComponentOperation header
    buf.writeUint32(entity)
    buf.writeUint32(componentId)
    buf.writeUint32(timestamp)
    buf.writeUint32(data.byteLength)

    // write body
    buf.writeBuffer(data, false)
  }

  export function read(buf: ByteBuffer): AppendValueMessage | null {
    const header = CrdtMessageProtocol.readHeader(buf)

    /* istanbul ignore if */
    if (!header) {
      return null
    }

    /* istanbul ignore if */
    if (header.type !== CrdtMessageType.APPEND_VALUE) {
      throw new Error('AppendValueOperation tried to read another message type.')
    }

    return {
      ...header,
      entityId: buf.readUint32() as Entity,
      componentId: buf.readUint32(),
      timestamp: buf.readUint32(),
      data: buf.readBuffer()
    }
  }
}
