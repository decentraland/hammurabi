import { QuickJSHandle, QuickJSContext } from '@dcl/quickjs-emscripten'

// Notice: setImmediate will be removed from the protocol requirements, until then
// we are implementing a good-enough replacement:

export function setupSetImmediate(vm: QuickJSContext) {
  const immediates: QuickJSHandle[] = [];

  vm.newFunction('setImmediate', (fn) => {
    immediates.push(fn.dupable ? fn.dup() : fn);
    fn.dispose();
  }).consume((fn) => vm.setProp(vm.global, 'setImmediate', fn));

  const int = setInterval(() => {
    while (immediates.length) {
      const elem = immediates.shift()!;

      try {
        vm.unwrapResult(vm.callFunction(elem, vm.undefined)).dispose();
      } catch (e: any) {
        console.error(e.message);
      }

      elem.dispose();
    }

    vm.runtime.executePendingJobs();
  }, 16);

  return {
    hasPendingJobs() {
      return immediates.length > 0;
    },
    dispose() {
      clearInterval(int);
    }
  };
}
