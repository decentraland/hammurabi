import { CrdtMessageProtocol } from './crdtMessageProtocol'
import { ByteBuffer } from '../ByteBuffer'
import { CrdtMessageType, CRDT_MESSAGE_HEADER_LENGTH, DeleteEntityMessage, DeleteEntityMessageBody } from './types'
import { Entity } from '../types'

/**
 * @public
 */
export namespace DeleteEntity {
  export const MESSAGE_HEADER_LENGTH = 4

  export function write(message: Omit<DeleteEntityMessageBody, 'type'>, buf: ByteBuffer) {
    // Write CrdtMessage header
    buf.writeUint32(CRDT_MESSAGE_HEADER_LENGTH + MESSAGE_HEADER_LENGTH)
    buf.writeUint32(CrdtMessageType.DELETE_ENTITY)

    // body
    buf.writeUint32(message.entityId)
  }

  export function read(buf: ByteBuffer): DeleteEntityMessage | null {
    const header = CrdtMessageProtocol.readHeader(buf)
    if (!header) {
      return null
    }

    if (header.type !== CrdtMessageType.DELETE_ENTITY) {
      throw new Error('DeleteEntity tried to read another message type.')
    }

    return {
      ...header,
      entityId: buf.readUint32() as Entity
    }
  }
}
