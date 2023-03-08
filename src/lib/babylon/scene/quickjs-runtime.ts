import { LoadableScene, resolveFileAbsolute } from "../../decentraland/scene/content-server-entity"
import { EngineApiInterface } from "../../decentraland/scene/types"
import { MaybeUint8Array, withQuickJsVm } from "../../quick-js"


export async function connectSceneContextUsingQuickJs(engineApi: EngineApiInterface, loadableScene: LoadableScene, isRunningDelegate: () => boolean) {
  // Load the main script
  if (!loadableScene.entity.metadata?.main) {
    throw new Error('Scene does not have a .main field')
  }
  const codeUrl = resolveFileAbsolute(loadableScene, loadableScene.entity.metadata?.main)
  if (!codeUrl) {
    throw new Error('It seems like the main file of the scene is not deployed')
  }
  const codeFetch = await fetch(codeUrl)
  const code = await codeFetch.text()

  // create runtime
  await withQuickJsVm(async (opts) => {
    // prepare the VM with the ~system/EngineApi as described in https://adr.decentraland.org/adr/ADR-133
    opts.provide({
      error: console.error.bind(console),
      log: console.log.bind(console),
      require(module) {
        if (module === '~system/EngineApi') {
          return {
            async crdtSendToRenderer(payload: { data: MaybeUint8Array }): Promise<{ data: Uint8Array[] }> {
              return engineApi.crdtSendToRenderer(payload)
            },
            async crdtGetState(): Promise<{ data: MaybeUint8Array[] }> {
              return engineApi.crdtGetState()
            },
            /**
             * The following functions only exist to maintain compatibility with older versions of the SDK.
             * After the public release of SDK7 is released, these should nolonger be necessary and should be
             * deleted
             * @deprecated
             */
            async subscribe() {
              return {}
            },
            async sendBatch() {
              return { events: [] }
            },

          }
        }
        throw new Error('Unknown module ' + module)
      },
    })

    opts.eval(code)

    await opts.onStart()

    let start = performance.now()
    const updateIntervalMs = 30

    while (isRunningDelegate()) {
      const now = performance.now()
      const dtMillis = now - start
      start = now

      const dtSecs = dtMillis / 1000

      await opts.onUpdate(dtSecs)

      // wait for next frame
      const ms = Math.max((updateIntervalMs - (performance.now() - start)) | 0, 0)
      await sleep(ms)
    }
  })
}


async function sleep(ms: number): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms | 0, 0)))
  return true
}