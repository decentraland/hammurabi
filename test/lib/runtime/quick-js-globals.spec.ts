
import { getQuickJS } from "@dcl/quickjs-emscripten"
import future from 'fp-future'
import { allowListES2020 } from "../../../src/lib/web-worker-runtime/sandbox"

async function evaluate(code: string) {
  const QuickJS = await getQuickJS()
  const vm = QuickJS.newContext()
  const fut = future<any[]>()

  const fn = vm.newFunction("log", (...args) => {
    fut.resolve(args.map(vm.dump))
  })
  vm.setProp(vm.global, "log", fn)

  const result = vm.evalCode(code)
  if (result.error) {
    fut.reject(vm.dump(result.error))
    result.error.dispose()
  } else {
    vm.unwrapResult(result).dispose()
  }

  fn.dispose()
  vm.dispose()

  return fut
}

export async function getQuickJsGlobals() {
  const [result] = await evaluate('"use math";\nlog(Object.getOwnPropertyNames(globalThis))')
  return result
}

export async function namesExistQuickJs(names: string[]) {
  const [result] = await evaluate(`"use math";\n"use strict";
    const missing = []
    const checks = ${JSON.stringify(names)}
    for (const name of checks) {
      if (!(name in globalThis)) missing.push(name)
    }
    log(missing)
  `)
  return result
}


describe('es2020 globals against quickjs', () => {
  it('checks all globals exist in quickjs', async () => {
    const missing = await namesExistQuickJs(allowListES2020)

    // the following functions are not present in QuickJS-emscripten
    expect(missing).toEqual([])
  })
})
