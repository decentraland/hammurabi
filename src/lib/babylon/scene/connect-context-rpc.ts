/**
 * This function will register the EngineApi and EnvironmentApi services
 * to the RPC server, so that the scene can call them.
 */

import { RpcServerPort } from "@dcl/rpc";
import { SceneContext } from "./context";
import * as codegen from "@dcl/rpc/dist/codegen"
import { EngineApiServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/engine_api.gen";
import { RuntimeServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/runtime.gen";

export function connectContextToRpcServer(port: RpcServerPort<SceneContext>) {
  codegen.registerService(port, RuntimeServiceDefinition, async () => ({
    async getSceneInformation(_payload, context) {
      return {
        baseUrl: context.loadableScene.baseUrl!,
        content: context.loadableScene.entity.content,
        metadataJson: JSON.stringify(context.loadableScene.entity.metadata),
        urn: context.loadableScene.id
      }
    },
    async getRealm() {
      return {
        realmInfo: undefined
      }
    },
    async getWorldTime() {
      return { seconds: 0 }
    },
    async readFile(req, context) {
      return context.readFile(req.fileName)
    }
  }))

  codegen.registerService(port, EngineApiServiceDefinition, async () => ({
    async subscribe() { throw 'not implemented' },
    async unsubscribe() { throw new Error('not implemented') },
    async sendBatch() { return { events: [] } },
    async crdtGetMessageFromRenderer() { throw new Error('not implemented') },
    crdtGetState(_req, context) {
      return context.crdtGetState()
    },
    crdtSendToRenderer(req, context) {
      return context.crdtSendToRenderer(req)
    }
  }))
}