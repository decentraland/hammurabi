import { getQuickJS } from '@dcl/quickjs-emscripten';
import { extractValueAndDispose, transferValueToVM } from './convert-handles';
import { RunWithVmOptions } from './types';
import { setupSetImmediate } from "./setupSetImmediate";

export async function withQuickJsVm<T>(
  cb: (opts: RunWithVmOptions) => Promise<T>
): Promise<{ result: T; leaking: boolean; }> {
  const Q = await getQuickJS();
  const vm = Q.newContext();

  vm.newObject().consume((exports) => {
    vm.newObject().consume((module) => {
      vm.setProp(module, 'exports', exports);
      vm.setProp(vm.global, 'module', module);
    });

    vm.setProp(vm.global, 'exports', exports);
  });

  vm.setProp(vm.global, 'self', vm.global);
  vm.setProp(vm.global, 'global', vm.global);
  const failures: any[] = [];

  vm.unwrapResult(
    vm.evalCode('(t) => { return (t && t instanceof Uint8Array) ? Array.from(t) : null }', 'isUint8Array.js')
  ).consume((isUint8Array) => vm.setProp(vm.global, 'isUint8Array', isUint8Array));

  let result: T;
  let leaking = false;

  const immediates = setupSetImmediate(vm);

  try {
    result = await cb({
      eval(code: string, filename?: string) {
        const result = vm.evalCode(code, filename);

        if (result.error) {
          const error = extractValueAndDispose(vm, result.error);
          if (error instanceof Error)
            throw error;
          throw Object.assign(new Error(error.toString()), error);
        }

        const $ = vm.unwrapResult(result);
        const ret = extractValueAndDispose(vm, $);
        return ret;
      },
      async onUpdate(dt) {
        const result = vm.evalCode(`module.exports.onUpdate(${JSON.stringify(dt)})`, 'onUpdate');

        const promiseHandle = vm.unwrapResult(result);

        // Convert the promise handle into a native promise and await it.
        // If code like this deadlocks, make sure you are calling
        // runtime.executePendingJobs appropriately.
        const resolvedResult = await vm.resolvePromise(promiseHandle);
        promiseHandle.dispose();
        const resolvedHandle = vm.unwrapResult(resolvedResult);
        return extractValueAndDispose(vm, resolvedHandle);
      },
      async onStart() {
        const result = vm.evalCode(`module.exports.onStart ? module.exports.onStart() : Promise.resolve()`, 'onStart');

        const promiseHandle = vm.unwrapResult(result);

        // Convert the promise handle into a native promise and await it.
        // If code like this deadlocks, make sure you are calling
        // runtime.executePendingJobs appropriately.
        const resolvedResult = await vm.resolvePromise(promiseHandle);
        promiseHandle.dispose();
        const resolvedHandle = vm.unwrapResult(resolvedResult);
        return extractValueAndDispose(vm, resolvedHandle);
      },
      provide(opts) {
        // create the "console" object
        vm.newObject().consume((console) => {
          vm.newFunction('log', (...args) => {
            const localArgs = args.map(($) => $.consume(($) => extractValueAndDispose(vm, $)));
            opts.log(...localArgs);
          }).consume((fn) => vm.setProp(console, 'log', fn));

          vm.newFunction('error', (...args) => {
            const localArgs = args.map(($) => $.consume(($) => extractValueAndDispose(vm, $)));
            opts.error(...localArgs);
          }).consume((fn) => vm.setProp(console, 'error', fn));

          vm.setProp(vm.global, 'console', console);
        });

        // create a proxy function for "require"
        vm.newFunction('require', (...args) => {
          const localArgs = args.map(($) => $.consume(($) => extractValueAndDispose(vm, $)));
          const fns = opts.require(localArgs[0]);
          return transferValueToVM(vm, fns);
        }).consume((fn) => vm.setProp(vm.global, 'require', fn));
      }
    });
  } catch (err: any) {
    failures.push(err);
    if (err instanceof Error)
      throw err;

    else
      throw Object.assign(new Error(err.message || `${err}`), err);
  } finally {
    let counter = 1000;
    while (immediates.hasPendingJobs() || vm.runtime.hasPendingJob()) {
      if (!counter--)
        throw new Error("VM won't finish immediates or pending jobs");
      await new Promise((res) => setTimeout(res, 1));
    }

    immediates.dispose();
    try {
      vm.dispose();
    } catch (err: any) {
      if (err.toString().includes('list_empty(&rt->gc_obj_list)') && !failures.length) {
        leaking = true;
      } else
        throw err;
    }
    if (failures.length) {
      throw failures[0];
    }
  }
  return { result, leaking };
}
