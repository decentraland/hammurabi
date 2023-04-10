import { runSnapshotTest } from "./testing-framework/runner"

runSnapshotTest('testing-realm/scene-0_1/src/index.ts', 'testing-realm/scene-0_1/bin/index.js', `test/integration/run-example-scene-in-vm.spec.ts.snapshot.md`)
