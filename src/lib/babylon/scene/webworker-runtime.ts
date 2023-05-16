import { createRpcServer } from "@dcl/rpc"
import { LoadableScene } from "../../decentraland/scene/content-server-entity"
import { SceneContext } from "./scene-context"
import * as codegen from "@dcl/rpc/dist/codegen"
import { Scene } from "@dcl/schemas"
import { WebWorkerTransport } from "@dcl/rpc/dist/transports/WebWorker"
import { connectContextToRpcServer } from "./connect-context-rpc"
import { TestingServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/testing.gen"

// first create a shared RPC server for this scene context
const rpcServer = createRpcServer<SceneContext>({})

declare var __DCL_TESTING_EXTENSION__: any

rpcServer.setHandler(async function handler(port) {
  // setup required services
  connectContextToRpcServer(port)

  // and a testing service
  codegen.registerService(port, TestingServiceDefinition, async () => ({
    async logTestResult(result, ctx) {
      console.log(`🧪 logTestResult(${ctx.loadableScene.urn}) ${JSON.stringify(result)}`)
      if (typeof __DCL_TESTING_EXTENSION__ !== 'undefined') return __DCL_TESTING_EXTENSION__.logTestResult(result, ctx.loadableScene.urn)
      return {}
    },
    async plan(plan, ctx) {
      console.log(`🧪 plan(${ctx.loadableScene.urn}) ${JSON.stringify(plan)}`)
      if (typeof __DCL_TESTING_EXTENSION__ !== 'undefined') return __DCL_TESTING_EXTENSION__.plan(plan, ctx.loadableScene.urn)
      return {}
    },
    async setCameraTransform(transform, ctx) {
      console.log(`🧪 setCameraTransform(${ctx.loadableScene.urn}) ${JSON.stringify(transform)}`)
      if (typeof __DCL_TESTING_EXTENSION__ !== 'undefined') return __DCL_TESTING_EXTENSION__.setCameraTransform(transform, ctx.loadableScene.urn)
      return {}
    }
  }))
})

export async function connectSceneContextUsingWebWorkerQuickJs(ctx: SceneContext, loadableScene: LoadableScene) {
  const scene = loadableScene.entity.metadata as Scene

  // create a new worker for this scene
  const worker = new Worker('/js/scene-runtime.worker.js', {
    name: `${scene.scene?.base} ${scene.display?.title || 'unnamed scene'}`,
    credentials: 'omit'
  })

  const transport = WebWorkerTransport(worker)

  rpcServer.attachTransport(transport, ctx)

  // when the scene stops, we will close the transport. that will release the resources
  // from the RPC server
  ctx.stopped.finally(() => {
    transport.close()
  })
}
