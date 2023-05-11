export function unwrapPromise(promise: Promise<any>) {
  promise.catch((e) => {
    console.error('ERROR IN PROMISE', e)
  })
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
