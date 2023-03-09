import { QuickJSContext, QuickJSHandle } from "@dcl/quickjs-emscripten"

/**
 * retrieveValue converts a value stored in the sandbox into a native JS value.
 */
export function retrieveValue(vm: QuickJSContext, val: QuickJSHandle) {
  const ret = vm.getProp(vm.global, 'isUint8Array').consume(
    (fn: Function) => vm.callFunction(fn, vm.global, val)
  )
  const isUint8Array = vm.unwrapResult(ret).consume(vm.dump)
  if (isUint8Array) {
    return new Uint8Array(isUint8Array)
  } else {
    const ret = vm.dump(val)
    return ret
  }
}

/**
 * retrieveValueAndDispose is an utility function to retrieve a value from the VM and then destroy it.
 */
export function retrieveValueAndDisposeIt(vm: QuickJSContext, val: QuickJSHandle) {
  const result = retrieveValue(vm, val)
  val.dispose()
  return result
}

/**
 * This function inserts a JS value into the VM
 */
export function createValue(vm: QuickJSContext, value: any): QuickJSHandle {
  switch (typeof value) {
    case 'number':
      return vm.newNumber(value)
    case 'string':
      return vm.newString(value)
    case 'boolean':
      if (value) {
        return true
      } else {
        return false
      }
    case 'undefined':
      return vm.undefined
  }
  if (value === null) {
    return vm.null
  }
  if (value instanceof Uint8Array) {
    return createUint8Array(vm, value)
  }
  if (looksLikeAPromise(value)) {
    return createPromise(vm, value)
  }
  if (looksLikeAFunction(value)) {
    return createFunction(vm, value)
  }
  if (Array.isArray(value)) {
    return createArray(vm, value)
  }
  if (typeof value === 'object') {
    return createObject(vm, value)
  }
  /* istanbul ignore next */
  return vm.undefined
}

function createObject(vm: QuickJSContext, value: any) {
  const obj = vm.newObject()
  for (const key of Object.getOwnPropertyNames(value)) {
    createValue(vm, value[key]).consume(($: any) => vm.setProp(obj, key, $))
  }
  return obj
}

function createArray(vm: QuickJSContext, value: any[]) {
  const array = vm.newArray()
  for (let i = 0; i < value.length; i++) {
    createValue(vm, value[i]).consume(($: any) => vm.setProp(array, i, $))
  }
  return array
}

function createFunction(vm: QuickJSContext, value: Function): QuickJSHandle {
  const name = value.name || 'unnamedFunction'
  return vm.newFunction(name, (...args: any[]) => {
    const localArgs = args.map(($) => $.consume(($: QuickJSHandle) => {
      const result = retrieveValue(vm, $)
      $.dispose()
      return result
    }))
    const val = value(...localArgs)
    return createValue(vm, val)
  })
}

/**
 * Expect the promise to be resolved in the native JS environment, and then push the result into the sandbox
 * environment. Once the action is resolved inside the QuickJS sandbox environment, `runtime.executePendingJobs() calls
 * any code inside the sandbox that might have been waiting for the promise's result.
 */
function createPromise(vm: QuickJSContext, value: any) {
  const promise = vm.newPromise()
  value
    .then((result: any) => createValue(vm, result).consume(($: any) => promise.resolve($)))
    .catch((error: any) => createValue(vm, error).consume(($: any) => promise.reject($)))
  void promise.settled.then(vm.runtime.executePendingJobs)
  return promise.handle
}

function looksLikeAFunction(value: any) {
  return typeof value === 'function'
}

function looksLikeAPromise(value: any) {
  return value && typeof value === 'object'
    && typeof value.then === 'function'
    && typeof value.catch === 'function'
}

function createUint8Array(value: any, vm: QuickJSContext) {
  const code = `new Uint8Array(${JSON.stringify(Array.from(value))})`
  return vm.unwrapResult(vm.evalCode(code))
}
