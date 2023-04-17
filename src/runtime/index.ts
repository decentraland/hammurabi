/// <reference lib="webworker" />

// this file starts a scene runtime in a web worker
import { createRpcClient } from '@dcl/rpc'
import { WebWorkerTransport } from '@dcl/rpc/dist/transports/WebWorker'
import { startQuickJsSceneRuntime } from '../lib/quick-js/rpc-scene-runtime'
import { defaultUpdateLoop } from '../lib/common-runtime/game-loop'
import { startWebWorkerSceneRuntime } from '../lib/web-worker-runtime/web-worker-scene-runtime'

createRpcClient(WebWorkerTransport(self))
  .then(async client => {
    // rpc initialization code
    const workerName = self.name
    const clientPort = await client.createPort(`scene-${workerName}`)
    // startQuickJsSceneRuntime(clientPort, {
    startWebWorkerSceneRuntime(clientPort, {
      // create some console wrappers
      error(...args) {
        console.error(`[SCENE ERROR ${self.name}]`, ...args)
      },
      log(...args) {
        console.log(`[SCENE LOG ${self.name}]`, ...args)
      },
      // and lastly set the update loop
      updateLoop: defaultUpdateLoop
    })
  })
  .catch((err) => console.error(`[WebWorker ${self.name} RUNTIME ERROR]`, err))
