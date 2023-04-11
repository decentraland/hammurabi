/**
 * This file implements a QuickJS runtime that runs in the context of a RpcClient.
 * It can run inside WebWorkers and the RPC will abstract all the communication with
 * the main thread. The @dcl/rpc module was designed with the performance considerations
 * of this application in mind.
 * 
 * Based on static service definitions (i.e. EngineApiServiceDefinition) the @dcl/rpc
 * framework tenerates asynchronous clients to communicate with the rpc counterpart.
 */

import { RpcClientPort } from '@dcl/rpc'
import * as codegen from '@dcl/rpc/dist/codegen'
import { RuntimeServiceDefinition } from '@dcl/protocol/out-ts/decentraland/kernel/apis/runtime.gen'
import { CrdtSendToRendererRequest, EngineApiServiceDefinition } from '@dcl/protocol/out-ts/decentraland/kernel/apis/engine_api.gen'
import { TestingServiceDefinition } from '@dcl/protocol/out-ts/decentraland/kernel/apis/testing.gen'
import { Scene } from '@dcl/schemas'
import { ProvideOptions, RunWithVmOptions, withQuickJsVm } from '.'
import { coerceMaybeU8Array } from './convert-handles'

export type RpcSceneRuntimeOptions = Pick<ProvideOptions, 'error' | 'log'> & {
  // this is a testing-only function to specify the function that will run the main loop
  updateLoop: (opts: Pick<RunWithVmOptions, 'onStart' | 'onUpdate'>, isRunning: () => boolean) => Promise<void>
}

// this function starts the scene runtime as explained in ADR-133
export async function startSceneRuntime(port: RpcClientPort, options: RpcSceneRuntimeOptions) {
  // we are going to need to load a remote module for this RPC client. the module
  // will provide all the information to run the scene
  const runtime = codegen.loadService(port, RuntimeServiceDefinition)

  // first we will fetch the information about the entity
  const scene = await runtime.getSceneInformation({})

  const fullData: Scene = JSON.parse(scene.metadataJson || '{}')

  if (!fullData || !fullData.main) {
    throw new Error(`No boostrap data`)
  }

  // look for the "bin/game.js" or similar specified in the .main field
  const mainFileName = fullData.main
  const mainFile = await runtime.readFile({ fileName: mainFileName })

  await withQuickJsVm(async (opts) => {
    opts.provide({
      ...options,
      require(moduleName) {
        switch (moduleName) {
          case '~system/EngineApi':
            const originalService = codegen.loadService(port, EngineApiServiceDefinition)

            // WARNING: quickJs is not yet capable of handling Uint8Array, so we need to coerce the Uint8Array
            //          values manually. This is a temporary solution until the proper fix is implemented
            return {
              ...originalService,
              async crdtSendToRenderer(payload: CrdtSendToRendererRequest) {
                return await originalService.crdtSendToRenderer({ data: coerceMaybeU8Array(payload.data) })
              }
            }
          case '~system/Testing':
            return codegen.loadService(port, TestingServiceDefinition)
          default:
            throw new Error('Unknown module ' + moduleName)
        }
      },
    })

    const decoder = new TextDecoder()
    await opts.eval(decoder.decode(mainFile.content), mainFileName)

    await options.updateLoop(opts, () => (port.state === 'open'))
  })
}

// this is the default update loop used by the scenes. it can be overriden by tests
export async function defaultUpdateLoop(opts: Pick<RunWithVmOptions, 'onStart' | 'onUpdate'>, isRunning: () => boolean) {
  await opts.onStart()

  let start = performance.now()

  // TODO: this is a very naive implementation of the update loop. we should define
  //       a stable way to enable a graceful shutdown of the scene runtime.
  while (isRunning()) {
    const now = performance.now()
    const dtMillis = now - start
    start = now

    const dtSecs = dtMillis / 1000

    await opts.onUpdate(dtSecs)
  }
}
