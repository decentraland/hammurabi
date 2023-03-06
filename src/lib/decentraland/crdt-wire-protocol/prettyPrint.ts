import { CrdtMessage, CrdtMessageType } from "./types";

export function prettyPrintCrdtMessage(msg: CrdtMessage): string {
  switch (msg.type) {
    case CrdtMessageType.APPEND_VALUE:
      return `APPEND c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp} v=byte[${msg.data.byteLength}]`
    case CrdtMessageType.PUT_COMPONENT:
      return `PUT c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp} v=byte[${msg.data.byteLength}]`
    case CrdtMessageType.DELETE_COMPONENT:
      return `DELETE_COMPONENT c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp}`
    case CrdtMessageType.DELETE_ENTITY:
      return `DELETE_ENTITY e=0x${msg.entityId.toString(16)}`
    default:
      return 'UNKNOWN'
  }
}