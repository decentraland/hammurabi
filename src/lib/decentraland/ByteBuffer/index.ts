import * as utf8 from '@protobufjs/utf8'
import { ByteBuffer } from './types'
export { ByteBuffer }

const defaultInitialCapacity = 10240

/**
 * ByteBuffer is a wrapper of DataView which also adds a read and write offset.
 *  Also in a write operation it resizes the buffer is being used if it needs.
 *
 * - Use read and write function to generate or consume data.
 * - Use set and get only if you are sure that you're doing.
 */
export class ReadWriteByteBuffer implements ByteBuffer {
  #buffer: Uint8Array
  #view: DataView
  woffset: number
  roffset: number
  /**
   * @param buffer - The initial buffer, provide a buffer if you need to set "initial capacity"
   * @param readingOffset - Set the cursor where begins to read. Default 0
   * @param writingOffset - Set the cursor to not start writing from the begin of it. Defaults to the buffer size
   */
  constructor(buffer?: Uint8Array | undefined, readingOffset?: number | undefined, writingOffset?: number | undefined) {
    this.#buffer = buffer || new Uint8Array(defaultInitialCapacity)
    this.#view = new DataView(this.#buffer.buffer, this.#buffer.byteOffset)
    this.woffset = writingOffset ?? (buffer ? this.#buffer.length : null) ?? 0
    this.roffset = readingOffset ?? 0
  }

  /**
   * Increement the write offset and resize the buffer if it needs.
   */
  #woAdd(amount: number) {
    if (this.woffset + amount > this.#buffer.byteLength) {
      const newsize = getNextSize(this.#buffer.byteLength, this.woffset + amount)
      const newBuffer = new Uint8Array(newsize)
      newBuffer.set(this.#buffer)
      const oldOffset = this.#buffer.byteOffset
      this.#buffer = newBuffer
      this.#view = new DataView(this.#buffer.buffer, oldOffset)
    }

    this.woffset += amount
    return this.woffset - amount
  }

  /**
   * Increment the read offset and throw an error if it's trying to read
   *  outside the bounds.
   */
  #roAdd(amount: number) {
    if (this.roffset + amount > this.woffset) {
      throw new Error('Outside of the bounds of writen data.')
    }

    this.roffset += amount
    return this.roffset - amount
  }

  buffer(): Uint8Array {
    return this.#buffer
  }
  bufferLength(): number {
    return this.#buffer.length
  }
  resetBuffer(): void {
    this.roffset = 0
    this.woffset = 0
  }
  currentReadOffset(): number {
    return this.roffset
  }
  currentWriteOffset(): number {
    return this.woffset
  }
  incrementReadOffset(amount: number): number {
    return this.#roAdd(amount)
  }
  remainingBytes(): number {
    return this.woffset - this.roffset
  }
  readFloat32(): number {
    return this.#view.getFloat32(this.#roAdd(4))
  }
  readFloat64(): number {
    return this.#view.getFloat64(this.#roAdd(8))
  }
  readInt8(): number {
    return this.#view.getInt8(this.#roAdd(1))
  }
  readInt16(): number {
    return this.#view.getInt16(this.#roAdd(2))
  }
  readInt32(): number {
    return this.#view.getInt32(this.#roAdd(4))
  }
  readInt64(): bigint {
    return this.#view.getBigInt64(this.#roAdd(8))
  }
  readUint8(): number {
    return this.#view.getUint8(this.#roAdd(1))
  }
  readUint16(): number {
    return this.#view.getUint16(this.#roAdd(2))
  }
  readUint32(): number {
    return this.#view.getUint32(this.#roAdd(4))
  }
  readUint64(): bigint {
    return this.#view.getBigUint64(this.#roAdd(8))
  }
  readBuffer() {
    const length = this.#view.getUint32(this.#roAdd(4))
    return this.#buffer.subarray(this.#roAdd(length), this.#roAdd(0))
  }
  readUtf8String() {
    const length = this.#view.getUint32(this.#roAdd(4))
    return utf8.read(this.#buffer, this.#roAdd(length), this.#roAdd(0))
  }
  incrementWriteOffset(amount: number): number {
    return this.#woAdd(amount)
  }
  toBinary() {
    return this.#buffer.subarray(0, this.woffset)
  }
  toCopiedBinary() {
    return new Uint8Array(this.toBinary())
  }
  writeBuffer(value: Uint8Array, writeLength: boolean = true) {
    if (writeLength) {
      this.writeUint32(value.byteLength)
    }

    const o = this.#woAdd(value.byteLength)
    this.#buffer.set(value, o)
  }
  writeUtf8String(value: string, writeLength: boolean = true) {
    const byteLength = utf8.length(value)

    if (writeLength) {
      this.writeUint32(byteLength)
    }

    const o = this.#woAdd(byteLength)

    utf8.write(value, this.#buffer, o)
  }
  writeFloat32(value: number): void {
    const o = this.#woAdd(4)
    this.#view.setFloat32(o, value)
  }
  writeFloat64(value: number): void {
    const o = this.#woAdd(8)
    this.#view.setFloat64(o, value)
  }
  writeInt8(value: number): void {
    const o = this.#woAdd(1)
    this.#view.setInt8(o, value)
  }
  writeInt16(value: number): void {
    const o = this.#woAdd(2)
    this.#view.setInt16(o, value)
  }
  writeInt32(value: number): void {
    const o = this.#woAdd(4)
    this.#view.setInt32(o, value)
  }
  writeInt64(value: bigint): void {
    const o = this.#woAdd(8)
    this.#view.setBigInt64(o, value)
  }
  writeUint8(value: number): void {
    const o = this.#woAdd(1)
    this.#view.setUint8(o, value)
  }
  writeUint16(value: number): void {
    const o = this.#woAdd(2)
    this.#view.setUint16(o, value)
  }
  writeUint32(value: number): void {
    const o = this.#woAdd(4)
    this.#view.setUint32(o, value)
  }
  writeUint64(value: bigint): void {
    const o = this.#woAdd(8)
    this.#view.setBigUint64(o, value)
  }
  // DataView Proxy
  getFloat32(offset: number): number {
    return this.#view.getFloat32(offset)
  }
  getFloat64(offset: number): number {
    return this.#view.getFloat64(offset)
  }
  getInt8(offset: number): number {
    return this.#view.getInt8(offset)
  }
  getInt16(offset: number): number {
    return this.#view.getInt16(offset)
  }
  getInt32(offset: number): number {
    return this.#view.getInt32(offset)
  }
  getInt64(offset: number): bigint {
    return this.#view.getBigInt64(offset)
  }
  getUint8(offset: number): number {
    return this.#view.getUint8(offset)
  }
  getUint16(offset: number): number {
    return this.#view.getUint16(offset)
  }
  getUint32(offset: number): number {
    return this.#view.getUint32(offset) >>> 0
  }
  getUint64(offset: number): bigint {
    return this.#view.getBigUint64(offset)
  }
  setFloat32(offset: number, value: number): void {
    this.#view.setFloat32(offset, value)
  }
  setFloat64(offset: number, value: number): void {
    this.#view.setFloat64(offset, value)
  }
  setInt8(offset: number, value: number): void {
    this.#view.setInt8(offset, value)
  }
  setInt16(offset: number, value: number): void {
    this.#view.setInt16(offset, value)
  }
  setInt32(offset: number, value: number): void {
    this.#view.setInt32(offset, value)
  }
  setInt64(offset: number, value: bigint): void {
    this.#view.setBigInt64(offset, value)
  }
  setUint8(offset: number, value: number): void {
    this.#view.setUint8(offset, value)
  }
  setUint16(offset: number, value: number): void {
    this.#view.setUint16(offset, value)
  }
  setUint32(offset: number, value: number): void {
    this.#view.setUint32(offset, value)
  }
  setUint64(offset: number, value: bigint): void {
    this.#view.setBigUint64(offset, value)
  }
}

/**
 * Take the max between currentSize and intendedSize and then plus 1024. Then,
 *  find the next nearer multiple of 1024.
 * @param currentSize - number
 * @param intendedSize - number
 * @returns the calculated number
 */
function getNextSize(currentSize: number, intendedSize: number) {
  const minNewSize = Math.max(currentSize, intendedSize) + 1024
  return Math.ceil(minNewSize / 1024) * 1024
}
