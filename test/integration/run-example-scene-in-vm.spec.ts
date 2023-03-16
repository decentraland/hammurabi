import { readFileSync } from "fs"
import { withQuickJsVm } from "../../src/lib/quick-js"
import { initTestEngine } from "../lib/babylon/babylon-test-helper"

const sceneFile = 'example-scene/bin/index.js'

describe("Run example scene in vm", () => {
  const sceneCode = readFileSync(sceneFile, 'utf8')

  const $ = initTestEngine({
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123',
    enableStaticEntities: true
  })

  it('onStart and onUpdate fail', async () =>
    withQuickJsVm(async (opts) => {
      const logs: any[] = []
      opts.provide({
        log(...args) {
          console.log('[SCENE]' + JSON.stringify(args))
        },
        error(...args) {
          console.error('[SCENE]' + JSON.stringify(args))
          process.exitCode = 1
        },
        require(moduleName) {
          console.log('  REQUIRE: ' + moduleName)

          if (moduleName === '~system/EngineApi') {
            return {
              async subscribe(data: { eventId: string }) {
                return {}
              },
              async sendBatch() {
                return { events: [] }
              },
              async crdtSendToRenderer(payload: { data: Uint8Array }): Promise<{ data: Uint8Array[] }> {
                console.log('[SCENE] crdtSendToRenderer')
                return $.ctx.crdtSendToRenderer(payload)
              },
              async crdtGetState(): Promise<{ data: Uint8Array[] }> {
                console.log('[SCENE] crdtGetState')
                return $.ctx.crdtGetState()
              }
            }
          }

          throw new Error('Unknown module ' + moduleName)
        }
      })

      opts.eval(sceneCode, sceneFile)

      await opts.onStart()
      await opts.onUpdate(0)
    }))
})