import { RuntimeServiceDefinition } from '@dcl/protocol/out-ts/decentraland/kernel/apis/runtime.gen'
import { RpcClientPort } from '@dcl/rpc'
import * as codegen from '@dcl/rpc/dist/codegen'
import { Scene } from '@dcl/schemas'

export async function getStartupData(port: RpcClientPort) {
  // we are going to need to load a remote module for this RPC client. the module
  // will provide all the information to run the scene
  const runtime = codegen.loadService(port, RuntimeServiceDefinition)

  // first we will fetch the information about the entity
  const sceneInfo = await runtime.getSceneInformation({})

  const scene: Scene = JSON.parse(sceneInfo.metadataJson || '{}')

  if (!scene || !scene.main) {
    throw new Error(`No boostrap data`)
  }

  // look for the "bin/game.js" or similar specified in the .main field
  const mainFileName = scene.main

  const mainFileContent = await async function() {
    const isSdk7 = (scene as any).runtimeVersion === '7'
    if (isSdk7) {
      const res = await runtime.readFile({ fileName: mainFileName })
      return res.content
    } else {
      const res = await fetch('https://renderer-artifacts.decentraland.org/sdk7-adaption-layer/main/index.min.js')
      return new Uint8Array(await res.arrayBuffer())
    }
  }()
    

  return { mainFileContent, scene, mainFileName }
}