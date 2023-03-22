import { CrdtMessageProtocol } from './crdtMessageProtocol'
import { ByteBuffer } from '../ByteBuffer'
import { AppendValueMessage, AppendValueMessageBody, CrdtMessageType, CRDT_MESSAGE_HEADER_LENGTH } from './types'
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
  export function write(message: Omit<AppendValueMessageBody, 'type'>, buf: ByteBuffer) {
    const messageLength = CRDT_MESSAGE_HEADER_LENGTH + MESSAGE_HEADER_LENGTH + message.data.byteLength

    // Write CrdtMessage header
    buf.writeUint32(messageLength)
    buf.writeUint32(CrdtMessageType.APPEND_VALUE)

    // Write ComponentOperation header
    buf.writeUint32(message.entityId)
    buf.writeUint32(message.componentId)
    buf.writeUint32(message.timestamp)
    buf.writeUint32(message.data.byteLength)

    // write body
    buf.writeBuffer(message.data, false)
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
