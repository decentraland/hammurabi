import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { prepareTestingFramework } from "."
import { withQuickJsVm } from "../../../src/lib/quick-js"
import { testWithEngine } from "../../lib/babylon/babylon-test-helper"

export function runSnapshotTest(sourceFile: string, bundle: string, snapshotFile?: string) {
  testWithEngine(`snapshot test for ${bundle}`, {
    baseUrl: '/',
    entity: { content: [], metadata: {} },
    id: '123',
    enableStaticEntities: true,
    snapshotFile: snapshotFile ?? `${sourceFile}.snapshot.md`,
    sourceFile,
  }, (env) => {
    test('run the snapshot test', async () => {
      const fw = prepareTestingFramework(env)

      if (!existsSync(bundle)) throw new Error(`Scene file ${bundle} does not exist`)

      const sceneCode = await readFile(bundle, 'utf8')

      await withQuickJsVm(async (opts) => {
        opts.provide({
          log(...args) {
            env.logMessage('  Note right of scene: ' + args.map(_ => JSON.stringify(_)).join(', '))
          },
          error(...args) {
            env.logMessage('  # console.error(' + args.map(_ => JSON.stringify(_)).join(', ') + ')')
            console.error('[SCENE ERROR]' + JSON.stringify(args, null, 2))
            process.exitCode = 1
          },
          require(moduleName) {
            env.logMessage('  scene-->>runtime: require(' + JSON.stringify(moduleName) + ')')

            if (moduleName === '~system/Testing') {
              return fw.module
            }

            if (moduleName === '~system/EngineApi') {
              return {
                async subscribe(data: { eventId: string }) {
                  return {}
                },
                async sendBatch() {
                  return { events: [] }
                },
                async crdtSendToRenderer(payload: { data: Uint8Array }): Promise<{ data: Uint8Array[] }> {
                  env.logMessage('  end')
                  return env.ctx.crdtSendToRenderer(payload)
                },
                async crdtGetState(): Promise<{ data: Uint8Array[] }> {
                  return env.ctx.crdtGetState()
                }
              }
            }

            throw new Error('Unknown module ' + moduleName)
          }
        })

        opts.eval(sceneCode, bundle)

        let frameCount = 0;

        async function runFrame(dt: number) {
          env.logMessage(`\n  runtime-->>scene: onUpdate(${dt}) frameNumber=${frameCount++}`)
          env.logMessage('  activate scene')

          env.logMessage('  loop Run Systems')
          env.logMessage('  scene-->>scene: engine.update()')
          await opts.onUpdate(dt)
          env.logMessage('  deactivate scene')
        }

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
      })
    })
  })
}