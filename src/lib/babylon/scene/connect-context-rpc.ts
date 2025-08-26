/**
 * This function will register the EngineApi and EnvironmentApi services
 * to the RPC server, so that the scene can call them.
 */

import { RpcServerPort } from "@dcl/rpc";
import * as codegen from "@dcl/rpc/dist/codegen"
import { EngineApiServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/engine_api.gen";
import { RuntimeServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/runtime.gen";
import { UserIdentityServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/user_identity.gen";
import { CommunicationsControllerServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/communications_controller.gen";
import { UserActionModuleServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/user_action_module.gen";
import { RestrictedActionsServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/restricted_actions.gen";
import { SignedFetchServiceDefinition } from "@dcl/protocol/out-js/decentraland/kernel/apis/signed_fetch.gen";
import { encodeMessage, MsgType, SceneContext } from "./scene-context";
import { userIdentity } from "../../decentraland/state";
import { signedFetch, getSignedHeaders } from "../../decentraland/identity/signed-fetch";
import { Authenticator } from "@dcl/crypto";

export function connectContextToRpcServer(port: RpcServerPort<SceneContext>) {  
  codegen.registerService(port, UserActionModuleServiceDefinition, async() => ({
    async requestTeleport() {
      return {}
    }
  }))
  codegen.registerService(port, RestrictedActionsServiceDefinition, async() => ({
    async movePlayerTo() { return { success: true } },
    async teleportTo() { return { success: true } },
    async triggerEmote() { return { success: true } }, 
    async changeRealm() { return { success: true } },
    async requestTeleport() { return { success: true } },
    async triggerSceneEmote() { return { success: true } },
    async showAvatarEmoteWheel() { return { success: true } },
    async showAvatarExpressionsWheel() { return { success: true } },
    async openExternalUrl() { return { success: true } },
    async openNftDialog() { return { success: true } },
    async setCommunicationsAdapter() { return { success: true } }
  }))
  codegen.registerService(port, RuntimeServiceDefinition, async () => ({
    async getSceneInformation(_payload, context) {
      return {
        baseUrl: context.loadableScene.baseUrl!,
        content: context.loadableScene.entity.content,
        metadataJson: JSON.stringify(context.loadableScene.entity.metadata),
        urn: context.loadableScene.urn
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
    },
    async getExplorerInformation() {
      return {
        previewMode: true,
        agent: 'desktop',
        platform: 'desktop',
        configurations: {}
      }
    }
  }))

  codegen.registerService(port, EngineApiServiceDefinition, async () => ({
    async subscribe() { throw new Error('not implemented') },
    async unsubscribe() { throw new Error('not implemented') },
    async sendBatch() { return { events: [] } },
    async crdtGetMessageFromRenderer() { throw new Error('not implemented') },
    async isServer() {
      return { isServer: true }
    },
    async crdtGetState(_req, context) {
      return context.crdtGetState()
    },
    async crdtSendToRenderer(req, context) {
      return context.crdtSendToRenderer(req)
    }
  }))

  codegen.registerService(port, CommunicationsControllerServiceDefinition, async () => ({
    async send() {
      return {
        data: []
      }
    },
    async sendBinary(req, context) {
      if (context.transport) {
        for (const peerData of req.peerData) {
          for (const data of peerData.data) {
            void context.transport.sendParcelSceneMessage({ sceneId: context.entityId, data: encodeMessage(data, MsgType.Uint8Array) }, peerData.address)
          }
        }
      }
      return {
        data: context.getNetworkMessages()
      }
    }
  }))

  codegen.registerService(port, UserIdentityServiceDefinition, async () => ({
    async getUserData() {
      const identity = await userIdentity.deref()

      return {
        data: {
          displayName: 'Gues2t',
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

  codegen.registerService(port, SignedFetchServiceDefinition, async () => ({
    async signedFetch(req, context) {
      const identity = await userIdentity.deref()
      
      try {
        const result = await signedFetch(
          req.url,
          identity.authChain,
          {
            method: req.init?.method || 'GET',
            headers: req.init?.headers || {},
            body: req.init?.body,
            responseBodyType: 'text'
          },
          {
            origin: 'hammurabi-server//',
            sceneId: context.loadableScene.urn
          }
        )

        return {
          ok: result.ok,
          status: result.status,
          statusText: result.statusText || '',
          headers: result.headers || {},
          body: result.text || '{}'
        }
      } catch (error) {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Error',
          headers: {},
          body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
    },

    async getHeaders(req) {
      const identity = await userIdentity.deref()
      
      try {
        const headers = getSignedHeaders(
          req.init?.method || 'GET',
          new URL(req.url).pathname,
          {
            origin: 'hammurabi-server://',
            ...req.init
          },
          (payload) => Authenticator.signPayload(identity.authChain, payload)
        )

        return { headers }
      } catch (error) {
        throw new Error(`Failed to generate signed headers: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }))
}