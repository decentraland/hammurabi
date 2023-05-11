import { ByteBuffer } from "./ByteBuffer";

export type VirtualScene = {
  // [from,to] range of entity numbers. the range is [) (inclusive, exclusive)
  readonly range: [number, number]

  createSubscription(): VirtualSceneSubscription

  // this should be called every tick, before sending the updates to the rest of the scenes via subscriptions
  update(): void
}

export type VirtualSceneSubscription = {
  // range of entity numbers that this subscription writes to. the range is [) (inclusive, exclusive)
  range: [number, number]

  // nullifies this subscription internal state
  dispose(): void

  // write all CRDT updates to the buffer. this function is stateful, always
  // writing the delta from the previous call. the first call dumps the entire state
  // to the moment
  getUpdates(writer: ByteBuffer): void
}
