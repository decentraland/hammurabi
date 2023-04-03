import { engine } from "@dcl/sdk/ecs";
import { assertEquals } from "@dcl/sdk/testing/assert";
import { test } from "@dcl/sdk/testing";
export * from '@dcl/sdk'

// this system counts the amount of times it was executed
let renderCount = 1;
engine.addSystem(() => { renderCount++ }, Infinity);

let tickCount = 0;
test("testing framework: yield works", function* () {
  renderCount = 0

  assertEquals(tickCount++, renderCount)
  yield
  assertEquals(tickCount++, renderCount)
  yield Promise.resolve()
  tickCount++ // 1 is added to the tickCount because the promise delays the execution of the next yield
  assertEquals(tickCount++, renderCount) 
  yield () => { }
  tickCount++ // 1 is added to the tickCount because the function call delays the continuation of the test by one tick
  assertEquals(tickCount++, renderCount) 
  yield async () => { }
  tickCount++ // 1 is added to the tickCount because the promise delays the execution of the next yield
  tickCount++ // 1 is added to the tickCount because the function call delays the continuation of the test by one tick
  assertEquals(tickCount++, renderCount) 
});

test("testing framework: ensure previous test's yield are resolved", function* () {
  assertEquals(tickCount, 9)
});