/**
 * This function will register the EngineApi and EnvironmentApi services
 * to the RPC server, so that the scene can call them.
 */

import { RpcServerPort } from "@dcl/rpc";
import { SceneContext } from "./scene-context";
import * as codegen from "@dcl/rpc/dist/codegen"
import { EngineApiServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/engine_api.gen";
import { RuntimeServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/runtime.gen";
import { UserIdentityServiceDefinition } from "@dcl/protocol/out-ts/decentraland/kernel/apis/user_identity.gen";
import { userIdentity } from "../../../explorer/state";

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

  codegen.registerService(port, UserIdentityServiceDefinition, async () => ({
    async getUserData() {
      const identity = await userIdentity.deref()

      return {
        data: {
          displayName: 'Guest',
          hasConnectedWeb3: !identity.isGuest,
          userId: identity.address,
          version: 1,
          avatar: {
            bodyShape: 'urn:decentraland:off-chain:base-avatars:BaseFemale',
            skinColor: '#443322',
            hairColor: '#663322',
            eyeColor: '#332211',
            wearables: [
              'urn:decentraland:off-chain:base-avatars:f_sweater',
              'urn:decentraland:off-chain:base-avatars:f_jeans',
              'urn:decentraland:off-chain:base-avatars:bun_shoes',
              'urn:decentraland:off-chain:base-avatars:standard_hair',
              'urn:decentraland:off-chain:base-avatars:f_eyes_00',
              'urn:decentraland:off-chain:base-avatars:f_eyebrows_00',
              'urn:decentraland:off-chain:base-avatars:f_mouth_00'
            ],
            snapshots: {
              face256: `not-found`,
              body: `not-found`
            },
          }
        }
      }
    },
    async getUserPublicKey() {
      const identity = await userIdentity.deref()
      return {
        address: identity.address
      }
    }
  }))
}