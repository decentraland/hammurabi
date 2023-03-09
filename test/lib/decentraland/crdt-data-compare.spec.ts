import { dataCompare } from '../../../src/lib/decentraland/crdt-internal/dataCompare'

describe('dataCompare', () => {
  const mapping = { 'left': 1, 'equal': 0, right: -1 } as const

  const testCases = [
    [1, 1, mapping.equal],
    [1, 0, mapping.left],
    [0, 1, mapping.right],
    [Uint8Array.of(0, 0), Uint8Array.of(0), mapping.left],
    [Uint8Array.of(0, 0), Uint8Array.of(0, 0), mapping.equal],
    [Uint8Array.of(0), Uint8Array.of(0, 0), mapping.right],
    [Uint8Array.of(1), Uint8Array.of(0), mapping.left],
    [Uint8Array.of(1), Uint8Array.of(1), mapping.equal],
    [Uint8Array.of(0), Uint8Array.of(1), mapping.right],
    [null, 1, mapping.right],
    [1, null, mapping.left],
    ['a', null, mapping.left],
    ['a', 'a', mapping.equal],
    ['a', 'b', mapping.right]
  ] as const
  let i = 0
  for (const [a, b, result] of testCases) {
    it(`runs test case ${i++}`, () => {
      expect({ a, b, result: dataCompare(a, b) }).toEqual({ a, b, result: result })
    })
  }
})