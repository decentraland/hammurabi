import { test } from "../src"

describe('some test', () => {
  it('uses an import', () => {
    expect(test()).toEqual(true)
  })
})