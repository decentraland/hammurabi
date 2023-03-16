import { Writer } from "protobufjs/minimal"
import { SerDe } from "../crdt-internal/components"

/**
 * This function creates a serializer and deserializer based on a Protobufjs type
 */
export function createSerDeFromProtobufJs<T>(protobufType: {
  decode(bytes: Uint8Array): T
  encode(value: T, writer: Writer): void
}): SerDe<T> {
  return {
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