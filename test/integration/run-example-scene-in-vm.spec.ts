import { readFileSync } from "fs"
import { withQuickJsVm } from "../../src/lib/quick-js"
import { testWithEngine } from "../lib/babylon/babylon-test-helper"

const sceneFile = 'example-scene/bin/index.js'

const sceneCode = readFileSync(sceneFile, 'utf8')

testWithEngine("Run example scene in vm", {
  baseUrl: '/',
  entity: { content: [], metadata: {} },
  id: '123',
  enableStaticEntities: true,
  snapshotFile: `test/integration/run-example-scene-in-vm.spec.ts.snapshot`
}, ($) => {
  test('onStart and onUpdate fail', async () =>
    withQuickJsVm(async (opts) => {
      const logs: any[] = []
      opts.provide({
        log(...args) {
          $.logMessage('  [SCENE LOG]' + JSON.stringify(args))
        },
        error(...args) {
          $.logMessage('  [ERROR]' + JSON.stringify(args))
          console.error('[SCENE]' + JSON.stringify(args))
          process.exitCode = 1
        },
        require(moduleName) {
          $.logMessage('[REQUIRE] ' + moduleName)

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

      $.logMessage('onStart()')
      await opts.onStart()
      $.logMessage('onUpdate(0)')
      await opts.onUpdate(0)
      $.logMessage('onUpdate(0.1)')
      await opts.onUpdate(0.1)
      $.logMessage('onUpdate(0.2)')
      await opts.onUpdate(0.2)
      $.logMessage('onUpdate(0.3)')
      await opts.onUpdate(0.3)
      $.logMessage('onUpdate(0.4)')
      await opts.onUpdate(0.4)
    }))
})