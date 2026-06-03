
// returns true if value has all the bits of the "checkMask" turned on
export function bitIntersectsAndContainsAll(value: number, checkMask: number) {
  return (value & checkMask) === checkMask
}

// returns true if any of the bits in the "checkMask" are turned on
export function bitIntersectsAndContainsAny(value: number, checkMask: number) {
  return (value & checkMask) !== 0
}