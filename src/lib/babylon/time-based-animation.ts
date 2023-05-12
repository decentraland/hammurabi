// This class is used to animate a scalar value from one value to another
// using linear interpolation and linear speed

export class LinearlyAnimatedScalar {
  animationStart: number = 0
  animationEnd: number = 0
  finalValue: number = 0
  initialValue: number = 0

  animateTo(now: number, targetValue: number, linearSpeed: number) {
    const value = this.getValue(now)

    if (targetValue === this.finalValue) return value

    const distance = Math.abs(targetValue - value)
    const time = distance / linearSpeed
  
    this.initialValue = value
    this.finalValue = targetValue
    this.animationStart = now
    this.animationEnd = now + time

    return value
  }

  getCurrentWeight(now: number) {
    const µ = Math.min(1, (now - this.animationStart) / (this.animationEnd - this.animationStart))
    const value = this.finalValue * µ + (1 - µ) * this.initialValue
    return { value, µ }
  }

  getValue(now: number) {
    return this.getCurrentWeight(now).value
  }
}