import { readdirSync } from 'fs'
import path from 'path'
import { itExecutes } from './testing-framework/run-command'
import { runSnapshotTest } from './testing-framework/runner'

const baseDir = 'example-scene/src/tests'

describe('scene snapshots tests', () => {
  itExecutes(`npm run build-tests`, 'example-scene', process.env)

  readdirSync(baseDir).forEach((file) => {
    if (file.endsWith('.test.ts')) {
      const sourceFile = path.join(baseDir, file)
      const bundle = sourceFile.replace(/\.ts$/, '.js')
      runSnapshotTest(sourceFile, bundle)
    }
  })
})