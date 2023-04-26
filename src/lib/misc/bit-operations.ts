
// returns true if value contains all bits turned on
export function bitIntersectsAndContainsAll(value: number, bits: number) {
  return (value & bits) === bits
}

// returns true if value contains any of bits are turned on
export function bitIntersectsAndContainsAny(value: number, bits: number) {
  return (value & bits) !== 0
}