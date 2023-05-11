export function createLogger(namespace: string) {
  let enabled = true
  const prefix = `[${namespace}]`
  return {
    get enabled() {
      return enabled
    },
    set enabled(value: boolean) {
      enabled = value
    },
    log(...args: any[]) {
      if (enabled)
        console.log(prefix, ...args)
    },
    error(...args: any[]) {
      console.error(prefix, ...args)
    },
  }
}