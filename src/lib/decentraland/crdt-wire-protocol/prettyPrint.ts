import { ReadWriteByteBuffer } from "../ByteBuffer";
import { SerDe } from "../crdt-internal/components";
import { CrdtMessage, CrdtMessageType } from "./types";

export function prettyPrintCrdtMessage(msg: CrdtMessage, serializer?: SerDe<any>): string {
  switch (msg.type) {
    case CrdtMessageType.APPEND_VALUE:
      return `APPEND c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp} v=${serializer ? JSON.stringify(serializer.deserialize(new ReadWriteByteBuffer(msg.data))) : `byte[${msg.data.byteLength}]`}`
    case CrdtMessageType.PUT_COMPONENT:
      return `PUT c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp} v=${serializer ? JSON.stringify(serializer.deserialize(new ReadWriteByteBuffer(msg.data))) : `byte[${msg.data.byteLength}]`}`
    case CrdtMessageType.DELETE_COMPONENT:
      return `DELETE_COMPONENT c=${msg.componentId} e=0x${msg.entityId.toString(16)} t=${msg.timestamp}`
    case CrdtMessageType.DELETE_ENTITY:
      return `DELETE_ENTITY e=0x${msg.entityId.toString(16)}`
    default:
      return 'UNKNOWN'
  }
}