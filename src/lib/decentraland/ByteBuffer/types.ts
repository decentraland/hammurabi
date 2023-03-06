/**
 * Implementation of read-write ByteBuffer with independent read and write heads.
 * Exposes methods to read and write a variety of different lengths of integers
 * and buffers. Each write moves the write head, and each read does the same.
 * 
 * @public
 */
export interface ByteBuffer {
  /**
   * @returns The entire current Uint8Array.
   *
   * WARNING: if the buffer grows, the view had changed itself,
   *  and the reference will be a invalid one.
   */
  buffer(): Uint8Array
  /**
   * @returns The capacity of the current buffer
   */
  bufferLength(): number
  /**
   * Resets byteBuffer to avoid creating a new one
   */
  resetBuffer(): void
  /**
   * @returns The current read offset
   */
  currentReadOffset(): number
  /**
   * @returns The current write offset
   */
  currentWriteOffset(): number
  /**
   * Reading purpose
   * Returns the previuos offsset size before incrementing
   */
  incrementReadOffset(amount: number): number
  /**
   * @returns How many bytes are available to read.
   */
  remainingBytes(): number
  readFloat32(): number
  readFloat64(): number
  readInt8(): number
  readInt16(): number
  readInt32(): number
  readInt64(): bigint
  readUint8(): number
  readUint16(): number
  readUint32(): number
  readUint64(): bigint
  readBuffer(): Uint8Array
  readUtf8String(): string
  /**
   * Writing purpose
   */
  /**
   * Increment offset
   * @param amount - how many bytes
   * @returns The offset when this reserving starts.
   */
  incrementWriteOffset(amount: number): number
  /**
   * Take care using this function, if you modify the data after, the
   * returned subarray will change too. If you'll modify the content of the
   * bytebuffer, maybe you want to use toCopiedBinary()
   *
   * @returns The subarray from 0 to offset as reference.
   */
  toBinary(): Uint8Array

  /**
   * Safe copied buffer of the current data of ByteBuffer
   *
   * @returns The subarray from 0 to offset.
   */
  toCopiedBinary(): Uint8Array

  writeUtf8String(value: string, writeLength?: boolean): void
  writeBuffer(value: Uint8Array, writeLength?: boolean): void
  writeFloat32(value: number): void
  writeFloat64(value: number): void
  writeInt8(value: number): void
  writeInt16(value: number): void
  writeInt32(value: number): void
  writeInt64(value: bigint): void
  writeUint8(value: number): void
  writeUint16(value: number): void
  writeUint32(value: number): void
  writeUint64(value: bigint): void
  // Dataview Proxy
  getFloat32(offset: number): number
  getFloat64(offset: number): number
  getInt8(offset: number): number
  getInt16(offset: number): number
  getInt32(offset: number): number
  getInt64(offset: number): bigint
  getUint8(offset: number): number
  getUint16(offset: number): number
  getUint32(offset: number): number
  getUint64(offset: number): bigint
  setFloat32(offset: number, value: number): void
  setFloat64(offset: number, value: number): void
  setInt8(offset: number, value: number): void
  setInt16(offset: number, value: number): void
  setInt32(offset: number, value: number): void
  setInt64(offset: number, value: bigint): void
  setUint8(offset: number, value: number): void
  setUint16(offset: number, value: number): void
  setUint32(offset: number, value: number): void
  setUint64(offset: number, value: bigint): void
}
