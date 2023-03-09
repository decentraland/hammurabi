import { permute } from "./permutation-helper"

describe('tests for permutation helper', () => {
  it('sanity 0', () => {
    const result = Array.from(permute([]))
    expect(result).toEqual([[]])
  })
  it('sanity 1', () => {
    const result = Array.from(permute([1]))
    expect(result).toEqual([
      [1],
    ])
  })
  it('sanity 2', () => {
    const result = Array.from(permute([1, 2]))
    expect(result).toEqual([
      [1, 2],
      [2, 1],
    ])
  })
  it('sanity 2.1', () => {
    const result = Array.from(permute([2, 2]))
    expect(result).toEqual([
      [2, 2],
      [2, 2],
    ])
  })
  it('sanity 3', () => {
    const result = Array.from(permute([1, 2, 3]))
    expect(result).toEqual([
      [1, 2, 3],
      [2, 1, 3],
      [2, 3, 1],
      [3, 2, 1],
      [3, 1, 2],
      [1, 3, 2],
    ])
  })
})