import { Entity } from "../types"

export enum CrdtMessageType {
  RESERVED = 0,

  // Component Operation
  PUT_COMPONENT = 1,
  DELETE_COMPONENT = 2,

  DELETE_ENTITY = 3,
  APPEND_VALUE = 4,

  MAX_MESSAGE_TYPE
}

/**
 * Min length = 8 bytes
 * All message length including
 * @param length - uint32 the length of all message (including the header)
 * @param type - define the function which handles the data
 * @public
 */
export type CrdtMessageHeader = {
  length: number
  type: number
}

export const CRDT_MESSAGE_HEADER_LENGTH = 8

/**
 * Min. length = header (8 bytes) + 16 bytes = 24 bytes
 *
 * @param entity - Uint32 number of the entity
 * @param componentId - Uint32 number of id
 * @param timestamp - Uint32 Lamport timestamp
 * @param data - Uint8[] data of component => length(4 bytes) + block of bytes[0..length-1]
 * @public
 */
export type PutComponentMessageBody = {
  type: CrdtMessageType.PUT_COMPONENT
  entityId: Entity
  componentId: number
  timestamp: number
  data: Uint8Array
}

/**
 * Min. length = header (8 bytes) + 16 bytes = 24 bytes
 *
 * @param entity - Uint32 number of the entity
 * @param componentId - Uint32 number of id
 * @param timestamp - Uint32 timestamp
 * @param data - Uint8[] data of component => length(4 bytes) + block of bytes[0..length-1]
 * @public
 */
export type AppendValueMessageBody = {
  type: CrdtMessageType.APPEND_VALUE
  entityId: Entity
  componentId: number
  timestamp: number
  data: Uint8Array
}

/**
 * @param entity - Uint32 number of the entity
 * @param componentId - Uint32 number of id
 * @param timestamp - Uint32 Lamport timestamp
 * @public
 */
export type DeleteComponentMessageBody = {
  type: CrdtMessageType.DELETE_COMPONENT
  entityId: Entity
  componentId: number
  timestamp: number
}

/**
 * @param entity - uint32 number of the entity
 * @public
 */
export type DeleteEntityMessageBody = {
  type: CrdtMessageType.DELETE_ENTITY
  entityId: Entity
}


export type AppendValueMessage = CrdtMessageHeader & AppendValueMessageBody
export type PutComponentMessage = CrdtMessageHeader & PutComponentMessageBody
export type DeleteComponentMessage = CrdtMessageHeader & DeleteComponentMessageBody
export type DeleteEntityMessage = CrdtMessageHeader & DeleteEntityMessageBody
export type CrdtMessage = PutComponentMessage | DeleteComponentMessage | DeleteEntityMessage | AppendValueMessage

export type CrdtMessageBody =
  | PutComponentMessageBody
  | DeleteComponentMessageBody
  | DeleteEntityMessageBody
  | AppendValueMessageBody