import { getQuickJS, QuickJSContext, QuickJSHandle } from '@dcl/quickjs-emscripten'
import { retrieveValue, retrieveValueAndDisposeIt } from './convert-handles'
import { RunWithVmOptions } from './types'

export async function withQuickJsVm<T>(
  cb: (opts: RunWithVmOptions) => Promise<T>
): Promise<{ result: T; leaking: boolean }> {

  const { vm, sandbox, immediates } = await createSandbox()
  const failures: any[] = []

  let result: T
  let leaking = false
  try {
    result = await cb(sandbox)
  } catch (err: any) {
    failures.push(err)
    throw err
  } finally {
    let counter = 1000
    while (immediates.hasPendingJobs() || vm.runtime.hasPendingJob()) {
      if (!counter--) throw new Error("VM won't finish immediates or pending jobs")
      await new Promise((res) => setTimeout(res, 1))
    }

    immediates.dispose()
    try {
      vm.dispose()
    } catch (err: any) {
      if (err.toString().includes('list_empty(&rt->gc_obj_list)') && !failures.length) {
        leaking = true
      } else throw err
    }
    if (failures.length) {
      throw failures[0]
    }
  }
  return { result, leaking }
}


/**
 * Create a QuickJS VM particularly crafted to run Decentraland scenes
 * 
 * @returns vm: the {QuickJSContext} created
 * @returns sandbox: an object with an interface to execute things inside the VM
 * @returns immediates: an array of the unresolved `setImmediate` calls living in the VM
 */
export async function createSandbox() {
  const Q = await getQuickJS()
  const vm = Q.newContext()

  const { immediates } = createGlobals(vm);

  return {
    vm,
    sandbox: {
      eval: evaluate,
      onUpdate,
      onStart,
      provide
    },
    immediates
  }

  /**
   * `evaluateCode` powers the `eval` function inside the sandbox. 
   */
  function evaluate(code: string, filename?: string) {
    const result = vm.evalCode(code, filename)
    const $ = vm.unwrapResult(result)
    const ret = retrieveValueAndDisposeIt(vm, $)
    return ret
  }

  /**
   * `onUpdate` is called frequently, expectedly once per frame. `dt` stands for `delta time`, the amount of milliseconds that elapsed since the last call to this function. 
   */
  function onUpdate(dt: number) {
    return evaluateExportedFunction(vm, 'onUpdate', {
      args: dt,
      failIfMissing: true
    })
  }

  /**
   * `onStart` is called once, when the scene starts. This is an optional, frequently useful, export that the scene can have.
   */
  function onStart() {
    return evaluateExportedFunction(vm, 'onStart', {
      failIfMissing: false
    })
  }

  function provide(opts: any) {
    createConsoleObject(vm, opts);
    injectRequirePolyfill(vm, opts);
  }
}

function createGlobals(vm: QuickJSContext) {
  createModuleAndExports(vm)
  setupSelfAndGlobal(vm)
  injectIsUint8Array(vm);

  return {
    immediates: setupSetImmediate(vm)
  } 
}

function setupSelfAndGlobal(vm: QuickJSContext) {
  vm.setProp(vm.global, 'self', vm.global);
  vm.setProp(vm.global, 'global', vm.global);
}

function createModuleAndExports(vm: QuickJSContext) {
  vm.newObject().consume((exports: any) => {
    vm.newObject().consume((module: any) => {
      vm.setProp(module, 'exports', exports);
      vm.setProp(vm.global, 'module', module);
    });

    vm.setProp(vm.global, 'exports', exports);
  });
}

function injectIsUint8Array(vm: any) {
  vm.unwrapResult(
    vm.evalCode('(t) => { return (t && t instanceof Uint8Array) ? Array.from(t) : null }', 'isUint8Array.js')
  ).consume((isUint8Array: QuickJSHandle) => vm.setProp(vm.global, 'isUint8Array', isUint8Array));
}

async function evaluateExportedFunction(vm: QuickJSContext, name: string, options: { args?: any, failIfMissing: boolean }) {
  const result = vm.evalCode(`if (exports.${name}) {
    exports.${name}(${stringifyArguments(options.args)})
  } else if (${options.failIfMissing}) {
    return Promise.reject('The function ${name} was not exported by the scene')
  } else {
    // TODO: Evaluate whether to warn that the function doesn't exist
    return Promise.resolve()
  }`, name)
  const promiseHandle = vm.unwrapResult(result)
  const resolvedResult = await vm.resolvePromise(promiseHandle)
  promiseHandle.dispose()
  const resolvedHandle = vm.unwrapResult(resolvedResult)
  return retrieveValue(vm, resolvedHandle)
}

// Notice: setImmediate will be removed from the protocol requirements, until then
// we are implementing a good-enough replacement:
export function setupSetImmediate(vm: QuickJSContext) {
  const immediates: QuickJSHandle[] = []

  vm.newFunction('setImmediate', (fn: QuickJSHandle) => {
    immediates.push(fn.dupable ? fn.dup() : fn)
    fn.dispose()
  }).consume((fn: QuickJSHandle) => vm.setProp(vm.global, 'setImmediate', fn))

  // the setImmediate will dissapear from the pro
  const int = setInterval(() => {
    while (immediates.length) {
      const elem = immediates.shift()!

      try {
        vm.unwrapResult(vm.callFunction(elem, vm.undefined)).dispose()
      } catch (e) {
        console.error(e)
      }

      elem.dispose()
    }

    vm.runtime.executePendingJobs()
  }, 16)

  return {
    hasPendingJobs() {
      return immediates.length > 0
    },
    dispose() {
      clearInterval(int)
    }
  }
}

function stringifyArguments(args: any) {
  if (Array.isArray(args)) {
    const stringArgs = JSON.stringify(args)
    return stringArgs.slice(1, stringArgs.length - 2)
  } else {
    return JSON.stringify(args)
  }
}

function injectRequirePolyfill(vm: any, opts: any) {
  vm.newFunction('require', (...args: any[]) => {
    const localArgs = args.map(($) => $.consume(($: QuickJSHandle) => retrieveValueAndDisposeIt(vm, $)));
    const fns = opts.require(localArgs[0]);
    return retrieveValue(vm, fns);
  }).consume((fn: Function) => vm.setProp(vm.global, 'require', fn));
}

function createConsoleObject(vm: any, opts: any) {
  vm.newObject().consume((console: any) => {
    vm.newFunction('log', (...args: any[]) => {
      const localArgs = args.map(($) => $.consume(($: QuickJSHandle) => retrieveValueAndDisposeIt(vm, $)));
      opts.log(...localArgs);
    }).consume((fn: Function) => vm.setProp(console, 'log', fn));

    vm.newFunction('error', (...args: any[]) => {
      const localArgs = args.map(($) => $.consume(($: QuickJSHandle) => retrieveValueAndDisposeIt(vm, $)));
      opts.error(...localArgs);
    }).consume((fn: Function) => vm.setProp(console, 'error', fn));

    vm.setProp(vm.global, 'console', console);
  });
}