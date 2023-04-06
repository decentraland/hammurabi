import { test } from "@dcl/sdk/testing";
import { Quaternion, Vector3 } from "@dcl/sdk/math";
export * from '@dcl/sdk'

test("sanity: test camera position is updated", function* (_) {
  yield _.setCameraTransform({
    position: Vector3.One(),
    rotation: Quaternion.fromEulerDegrees(10, 10, 0),
  })
})
