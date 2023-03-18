import { CrdtMessageProtocol } from './crdtMessageProtocol'
import { ByteBuffer } from '../ByteBuffer'
import { CrdtMessageType, CRDT_MESSAGE_HEADER_LENGTH, DeleteComponentMessage, DeleteComponentMessageBody } from './types'
import { Entity } from '../types'

/**
 * @public
 */
export namespace DeleteComponent {
  export const MESSAGE_HEADER_LENGTH = 12

  /**
   * Write DeleteComponent message
   */
  export function write(message: Omit<DeleteComponentMessageBody, 'type'>, buf: ByteBuffer) {
    const messageLength = CRDT_MESSAGE_HEADER_LENGTH + MESSAGE_HEADER_LENGTH

    // Write CrdtMessage header
    buf.writeUint32(messageLength)
    buf.writeUint32(CrdtMessageType.DELETE_COMPONENT)

    // Write ComponentOperation header
    buf.writeUint32(message.entityId)
    buf.writeUint32(message.componentId)
    buf.writeUint32(message.timestamp)
  }

  export function read(buf: ByteBuffer): DeleteComponentMessage | null {
    const header = CrdtMessageProtocol.readHeader(buf)

    if (!header) {
      return null
    }

    if (header.type !== CrdtMessageType.DELETE_COMPONENT) {
      throw new Error('DeleteComponentOperation tried to read another message type.')
    }

    const msg = {
      ...header,
      entityId: buf.readUint32() as Entity,
      componentId: buf.readUint32(),
      timestamp: buf.readUint32()
    }

    return msg
  }
}
