import { Writer } from "protobufjs/minimal"
import { ApplyComponentOperation, ComponentDeclaration } from "../crdt-internal/components"

/**
 * This function creates a serializer and deserializer based on a Protobufjs type
 */
export function declareComponentUsingProtobufJs<T, Num extends number>(protobufType: {
  decode(bytes: Uint8Array): T
  encode(value: T, writer: Writer): void
}, componentId: Num, applyChanges: ApplyComponentOperation<T>): ComponentDeclaration<T, Num> {
  return {
    componentId,
    applyChanges,
    deserialize(buffer) {
      return protobufType.decode(buffer.toBinary())
    },
    serialize(value, buffer) {
      const writer = new Writer()
      protobufType.encode(value, writer)
      buffer.writeBuffer(writer.finish(), false)
    },
  }
}