/// <reference lib="webworker" />

// this file starts a scene runtime in a web worker
import { createRpcClient } from '@dcl/rpc'
import { WebWorkerTransport } from '@dcl/rpc/dist/transports/WebWorker'
import { defaultUpdateLoop, startSceneRuntime } from '../lib/quick-js/rpc-scene-runtime'

createRpcClient(WebWorkerTransport(self))
  .then(async client => {
    // rpc initialization code
    const workerName = self.name
    const clientPort = await client.createPort(`scene-${workerName}`)
    startSceneRuntime(clientPort, {
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
