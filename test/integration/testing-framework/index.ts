/// <reference path="../../../testing-realm/node_modules/@dcl/js-runtime/apis.d.ts" />

import { Quaternion, Vector3 } from "@babylonjs/core"
import { Transform } from "../../../src/lib/decentraland/sdk-components/transform-component"
import { SceneTestEnvironment } from "../../lib/babylon/babylon-test-helper"
import type { logTestResult, plan, setCameraTransform } from "~system/Testing"

export type TestingModule = {
  logTestResult: typeof logTestResult
  plan: typeof plan
  setCameraTransform: typeof setCameraTransform
}

export function prepareTestingFramework(env: SceneTestEnvironment) {
  type TestResult = {
    name: string
    ok: boolean
    error?: string
  }

  const testResults: TestResult[] = []

  const pendingTests = new Set<string>()

  const module: TestingModule = {
    async logTestResult(result: TestResult) {
      env.logMessage('  # [TEST RESULT]' + JSON.stringify(result))
      testResults.push(result)
      pendingTests.delete(result.name)
      return {}
    },
    async plan(data: { tests: { name: string }[] }) {
      data.tests.forEach((test) => pendingTests.add(test.name))
      return {}
    },
    async setCameraTransform(transform: Transform) {
      env.logMessage('   # [setCameraTransform]' + JSON.stringify(transform))

      if (!env.camera.position) env.camera.position = new Vector3()
      if (!env.camera.rotationQuaternion) env.camera.rotationQuaternion = Quaternion.Identity()

      env.camera.position.copyFromFloats(
        transform.position.x,
        transform.position.y,
        transform.position.z
      );
      env.camera.rotationQuaternion.copyFromFloats(
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
        transform.rotation.w,
      )
      return {}
    }
  }

  return {
    hasPendingTests() {
      return pendingTests.size > 0
    },
    // Run this after all tests are done
    assert() {
      const failures = testResults.filter($ => !$.ok)
      const errors: string[] = []

      if (failures.length) {
        for (const failedTest of failures) {
          errors.push(`! Test failed: ${failedTest.name}`)
          errors.push(`  Error ${failedTest.error}`)
          console.error(failedTest.error)
          env.logMessage(`  Note right of scene: 🔴 Test failed ${failedTest.name}`)
          env.logMessage(`  Note right of scene: ${JSON.stringify(failedTest.error)}`)
        }
      }

      if (pendingTests.size) {
        for (const pendingTest of pendingTests) {
          errors.push(`Test timed out: ${pendingTest}`)
          env.logMessage(`  Note right of scene: 🔴 Test timed out ${pendingTest}`)
        }
      }

      if (errors.length) {
        throw new Error(errors.join('\n'))
      }
    },
    module
  }
}