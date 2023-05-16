import type { RpcClientPort } from '@dcl/rpc'
import { loadModuleForPort } from '../common-runtime/modules'
import { RpcSceneRuntimeOptions, RuntimeAbstraction } from '../common-runtime/types'

export type GenericRpcModule = Record<string, (...args: any) => Promise<unknown>>

export type SceneInterface = {
  onUpdate(dt: number): Promise<void>
  onStart(): Promise<void>
}

export type SDK7Module = RuntimeAbstraction & {
  readonly exports: Partial<SceneInterface>
}

export function createModuleRuntime(
  clientPort: RpcClientPort,
  console: Pick<RpcSceneRuntimeOptions, 'log' | 'error'>,
  globalObject: Record<string, any>
): SDK7Module {
  const exports: Partial<SceneInterface> = {}

  const module = { exports }

  Object.defineProperty(globalObject, 'module', {
    configurable: false,
    get() {
      return module
    }
  })

  Object.defineProperty(globalObject, 'exports', {
    configurable: false,
    get() {
      return module.exports
    }
  })

  Object.defineProperty(globalObject, 'console', {
    value: {
      log: console.log.bind(console),
      info: console.log.bind(console),
      debug: console.log.bind(console),
      trace: console.log.bind(console),
      warning: console.error.bind(console),
      error: console.error.bind(console)
    }
  })

  const loadedModules: Record<string, GenericRpcModule> = {}

  Object.defineProperty(globalObject, 'require', {
    configurable: false,
    value: (moduleName: string) => {
      if (moduleName in loadedModules) return loadedModules[moduleName]
      const module = loadModuleForPort(clientPort, moduleName)
      loadedModules[moduleName] = module
      return module
    }
  })

  const setImmediateList: Array<() => Promise<void>> = []

  Object.defineProperty(globalObject, 'setImmediate', {
    configurable: false,
    value: (fn: () => Promise<void>) => {
      setImmediateList.push(fn)
    }
  })

  async function runSetImmediate(): Promise<void> {
    if (setImmediateList.length) {
      for (const fn of setImmediateList) {
        try {
          await fn()
        } catch (err: any) {
          console.error(err)
        }
      }
      setImmediateList.length = 0
    }
  }

  return {
    get exports() {
      return module.exports
    },
    async onStart() {
      if (module.exports.onStart) {
        try {
          await module.exports.onStart()
        } catch (err: any) {
          console.error(err)
          console.error('⚠️⚠️⚠️⚠️ THE SCENE HAS SUFFERED AN ERROR AND WILL NOW BE TERMINATED ⚠️⚠️⚠️⚠️')
          throw err
        }
      }
      await runSetImmediate()
    },
    async onUpdate(deltaTime: number) {
      if (module.exports.onUpdate) {
        try {
          await module.exports.onUpdate(deltaTime)
        } catch (err) {
          console.error(err)
          console.error('⚠️⚠️⚠️⚠️ THE SCENE HAS SUFFERED AN ERROR AND WILL NOW BE TERMINATED ⚠️⚠️⚠️⚠️')
          throw err
        }
      }
      await runSetImmediate()
    },
    isRunning() {
      return true
    }
  }
}
