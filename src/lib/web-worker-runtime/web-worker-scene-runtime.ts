/**
 * This file implements a sandboxed runtime that runs in the context of a RpcClient.
 * It can run inside WebWorkers and the RPC will abstract all the communication with
 * the main thread. The @dcl/rpc module was designed with the performance considerations
 * of this application in mind.
 * 
 * Based on static service definitions (i.e. EngineApiServiceDefinition) the @dcl/rpc
 * framework tenerates asynchronous clients to communicate with the rpc counterpart.
 */

import { RpcClientPort } from '@dcl/rpc'
import { RpcSceneRuntimeOptions } from '../common-runtime/types'
import { getStartupData } from '../common-runtime/startup'
import { createModuleRuntime } from './context'
import { customEvalSdk } from './sandbox'

// this function starts the scene runtime as explained in ADR-133
export async function startWebWorkerSceneRuntime(port: RpcClientPort, options: RpcSceneRuntimeOptions) {
  const { mainFile } = await getStartupData(port)
 
  // first create an empty sandbox
  const context: any = Object.create(null)
  // and add to it the `module`, `exports` and `console` required by ADR-133 
  const sceneRuntime = createModuleRuntime(port, options, context)

  // then run the scene
  const decoder = new TextDecoder()
  const sceneSource = decoder.decode(mainFile.content)
  const enableSceneSourceMaps = true
  await customEvalSdk(sceneSource, context, enableSceneSourceMaps)

  // and lastly the game loop using the module.exports of the globalSdkContext
  await options.updateLoop({ ...sceneRuntime, isRunning: () => (port.state === 'open') })
}


