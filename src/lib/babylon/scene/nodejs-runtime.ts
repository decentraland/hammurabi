import { createRpcServer, createRpcClient } from "@dcl/rpc"
import { MemoryTransport } from "@dcl/rpc/dist/transports/Memory"
import { LoadableScene } from "../../decentraland/scene/content-server-entity"
import { SceneContext } from "./scene-context"
import * as codegen from "@dcl/rpc/dist/codegen"
import { Scene } from "@dcl/schemas"
import { connectContextToRpcServer } from "./connect-context-rpc"
import { TestingServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/testing.gen"
import { startWebWorkerSceneRuntime as startProcessSceneRuntime } from '../../web-worker-runtime/web-worker-scene-runtime'
import { defaultUpdateLoop } from '../../common-runtime/game-loop'

// Create shared RPC server for this scene context
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
    },
    async takeAndCompareScreenshot() {
      return {
        storedSnapshotFound: false,
        error: 'Not implemented in headless mode'
      }
    }
  }))
})

export async function connectSceneContextUsingNodeJs(ctx: SceneContext, loadableScene: LoadableScene) {
  const scene = loadableScene.entity.metadata as Scene
  
  console.log(`[NODEJS] Starting Process runtime for scene: ${scene.display?.title || 'unnamed scene'}`)
  
  try {
    // Create memory transport for in-process communication
    const memoryTransport = MemoryTransport()
    
    // Create RPC client using memory transport
    const rpcClient = createRpcClient(memoryTransport.client)
    
    // Connect server to memory transport with scene context
    rpcServer.attachTransport(memoryTransport.server, ctx)
    
    // Initialize RPC client and create port
    const client = await rpcClient
    const clientPort = await client.createPort(`scene-${scene.scene?.base || 'unknown'}`)
    
    // Start Process scene runtime (same logic but with MemoryTransport)
    await startProcessSceneRuntime(clientPort, {
      // create console wrappers
      error(...args) {
        console.error(`[SCENE ERROR ${scene.display?.title || 'unnamed'}]`, ...args)
      },
      log(...args) {
        console.log(`[SCENE LOG ${scene.display?.title || 'unnamed'}]`, ...args)
      },
      // set the update loop
      updateLoop: defaultUpdateLoop
    })
    
    console.log(`[NODEJS] Process runtime started successfully for scene: ${scene.display?.title}`)
  } catch (error) {
    console.error(`[NODEJS] Failed to start Process runtime for scene ${scene.display?.title}:`, error)
  }
}