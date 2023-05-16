import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { prepareTestingFramework } from "."
import { testWithEngine } from "../../lib/babylon/babylon-test-helper"
import { createRpcClient, createRpcServer } from "@dcl/rpc"
import * as codegen from "@dcl/rpc/dist/codegen"
import { TestingServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/testing.gen"
import { MemoryTransport } from "@dcl/rpc/dist/transports/Memory"
import { startQuickJsSceneRuntime } from "../../../src/lib/quick-js/rpc-scene-runtime"
import { connectContextToRpcServer } from "../../../src/lib/babylon/scene/connect-context-rpc"
import { SceneContext } from "../../../src/lib/babylon/scene/scene-context"
import { Scene } from "@dcl/schemas"

export function runSnapshotTest(sourceFile: string, bundle: string, snapshotFile?: string) {
  testWithEngine(`snapshot test for ${bundle}`, {
    baseUrl: '/',
    entity: { content: [{ file: 'game.js', hash: '123' }], metadata: { main: 'game.js' } as Scene, type: 'scene' },
    urn: '123',
    enableStaticEntities: true,
    snapshotFile: snapshotFile ?? `${sourceFile}.snapshot.md`,
    sourceFile,
  }, (env) => {
    test('run the snapshot test', async () => {
      const fw = prepareTestingFramework(env)

      if (!existsSync(bundle)) throw new Error(`Scene file ${bundle} does not exist`)

      const sceneCode = await readFile(bundle, 'utf8')

      const rpcServer = createRpcServer<SceneContext>({})

      // the handler function will be called every time a port is created.
      // it should register the available APIs/Modules for the specified port
      rpcServer.setHandler(async function handler(port) {
        connectContextToRpcServer(port)
        codegen.registerService(port, TestingServiceDefinition, async () => fw.module)
      })

      // 3rd step: create a transport pair. In this case we will use a in-memory transport
      //           which creates two mutually connected virtual sockets
      const { client: clientSocket, server: serverSocket } = MemoryTransport()

      // 4th step: create a client connection
      const clientPromise = createRpcClient(clientSocket)

      // 5th step: connect the "socket" to the server
      rpcServer.attachTransport(serverSocket, env.ctx)

      const originalReadFile = env.ctx.readFile
      jest.spyOn(env.ctx, 'readFile').mockImplementation(async (fileName) => {
        if (fileName === 'game.js') {
          return {
            content: new TextEncoder().encode(sceneCode),
            hash: '123'
          }
        } else return originalReadFile.apply(this, fileName)
      })

      // the RPC client can multiplex multiple named sessions, we call them "ports"
      const client = await clientPromise
      const port = await client.createPort(bundle)

      // once the socket is connected, we proceed to start the runtime
      await startQuickJsSceneRuntime(port, {
        log(...args) {
          env.logMessage('  Note right of scene: ' + args.map(_ => JSON.stringify(_)).join(', '))
        },
        error(...args) {
          env.logMessage('  # console.error(' + args.map(_ => JSON.stringify(_)).join(', ') + ')')
          console.error('[SCENE ERROR]' + JSON.stringify(args, null, 2))
          process.exitCode = 1
        },
        async updateLoop(opts) {
          let frameCount = 0;

          async function runFrame(dt: number) {
            env.logMessage(`\n  runtime-->>scene: onUpdate(${dt}) frameNumber=${frameCount++}`)
            env.logMessage('  activate scene')

            env.logMessage('  loop Frame')
            env.logMessage('  loop Run Systems')
            env.logMessage('  scene-->>scene: engine.update()')
            await opts.onUpdate(dt)
            env.logMessage('  end')
            env.logMessage('  deactivate scene')
          }

          env.startEngine()

          env.logMessage('  runtime-->>scene: onStart()')
          env.logMessage('  activate scene')
          await opts.onStart()
          env.logMessage('  deactivate scene')

          // by protocol definition, the first update has always time 0
          await runFrame(0)

          if (snapshotFile) {
            await runFrame(0.1)
            await runFrame(0.2)
            await runFrame(0.3)
            await runFrame(0.4)
          }

          const now = Date.now()
          while (fw.hasPendingTests() && (Date.now() - now < 1000)) {
            await runFrame(0.5)
          }

          fw.assert()
        }
      })
    })
  })
}
