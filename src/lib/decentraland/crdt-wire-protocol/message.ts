import { CrdtMessageProtocol } from './crdtMessageProtocol'
import { ByteBuffer } from '../ByteBuffer'
import { CrdtMessageType, CrdtMessage } from './types'
import { PutComponentOperation } from './putComponent'
import { DeleteComponent } from './deleteComponent'
import { DeleteEntity } from './deleteEntity'
import { AppendValueOperation } from './appendValue'

/**
 * Read the initial message of a ByteBuffer and moves the reading head.
 * 
 * Returns a CrdtMessage when it recognizes a valid message.
 * Returns null if it is an unrecognizable message
 * Returns undefined if it cannot read a valid CRDT header
 */
export function readMessage(buf: ByteBuffer): CrdtMessage | null | undefined {
  const header = CrdtMessageProtocol.peekHeader(buf)
  if (!header) return undefined

  if (header.type === CrdtMessageType.PUT_COMPONENT) {
    return PutComponentOperation.read(buf)
  } else if (header.type === CrdtMessageType.DELETE_COMPONENT) {
    return DeleteComponent.read(buf)
  } else if (header.type === CrdtMessageType.APPEND_VALUE) {
    return AppendValueOperation.read(buf)
  } else if (header.type === CrdtMessageType.DELETE_ENTITY) {
    return DeleteEntity.read(buf)
  }

  return null
}

/**
 * Reads CRDT messages and consumes them from the byteBuffer.
 * 
 * Once it finishes, the ByteBuffer can be considered fully read.
 */
export function* readAllMessages(buf: ByteBuffer): Iterable<CrdtMessage> {
  let msg: CrdtMessage | null | undefined
  while ((msg = readMessage(buf)) !== undefined) {
    if (msg) yield msg
  }
}