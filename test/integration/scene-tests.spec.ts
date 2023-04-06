import { readdirSync } from 'fs'
import path from 'path'
import { itExecutes } from './testing-framework/run-command'
import { runSnapshotTest } from './testing-framework/runner'

const baseDir = 'testing-realm/scene-0_0/src/tests'

describe('scene snapshots tests', () => {
  itExecutes(`npm run build-tests`, 'testing-realm/scene-0_0', process.env)

  readdirSync(baseDir).forEach((file) => {
    if (file.endsWith('.test.ts')) {
      const sourceFile = path.join(baseDir, file)
      const bundle = sourceFile.replace(/\.ts$/, '.js')
      runSnapshotTest(sourceFile, bundle)
    }
  })
})