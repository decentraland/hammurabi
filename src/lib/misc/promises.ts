export function unwrapPromise(promise: Promise<any>) {
  promise.catch((e) => {
    console.error('ERROR IN PROMISE', e)
  })
}