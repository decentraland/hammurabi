import { runSnapshotTest } from "./testing-framework/runner"

runSnapshotTest('example-scene/src/index.ts', 'example-scene/bin/index.js', `test/integration/run-example-scene-in-vm.spec.ts.snapshot.md`)
