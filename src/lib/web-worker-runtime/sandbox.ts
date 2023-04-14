/**
 * This file implements a naive sandboxing method to remove every funtion that is not
 * in the allow list from the execution context. It is definitely bypasseable but also
 * good enough since the scenes run in an already isolated context, WebWorkers.
 */

export const allowListES2020: Array<keyof typeof globalThis> = [
  'Array',
  'ArrayBuffer',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'Error',
  'escape',
  'eval',
  'EvalError',
  'Float32Array',
  'Float64Array',
  'Function',
  'globalThis',
  'Infinity',
  'Int16Array',
  'Int32Array',
  'Int8Array',
  'isFinite',
  'isNaN',
  'JSON',
  'Map',
  'Math',
  'NaN',
  'Number',
  'Object',
  'parseFloat',
  'parseInt',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'SharedArrayBuffer',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'undefined',
  'unescape',
  'URIError',
  'WeakMap',
  'WeakSet'
]

const defer: (fn: Function) => void = (Promise.resolve().then as any).bind(Promise.resolve() as any)

export async function runWithScope(code: string, context: any) {
  const func = new Function('globalThis', `with (globalThis) {${code}}`)
  const proxy: any = new Proxy(context, {
    has() {
      return true
    },
    get(target, propKey, receiver) {
      if (propKey === 'eval') return eval
      if (propKey === 'globalThis') return proxy
      if (propKey === 'global') return proxy
      if (propKey === 'undefined') return undefined
      if (context[propKey] !== undefined) return context[propKey]
      if (allowListES2020.includes(propKey as any)) {
        return (globalThis as any)[propKey]
      }
      return undefined
    }
  })

  return defer(() => func.call(proxy, proxy))
}

export async function customEvalSdk(code: string, context: any, devtool: boolean) {
  const newCode = devtool ? `eval(${JSON.stringify(code)})` : code

  return runWithScope(newCode, context)
}