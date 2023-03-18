import type { TransformType } from "@dcl/sdk/ecs"

export type TestHelpers = {
  /**
   * Instructs the renderer to set the camera transform to the provided argument.
   * This function resolves the next frame and fails if the CameraTransform is not
   * equal to the provided argument.
   */
  setCameraTransform(transform: Pick<TransformType, 'position' | 'rotation'>): Promise<void>
}

/** @internal */
export type TestFunction = (helpers: TestHelpers) => (Generator | Promise<any>)
/** @internal */
export type TestPlanEntry = { name: string, fn: TestFunction }

export type TestDefinitionFunction = (name: string, fn: TestFunction) => void

/** @internal */
export type RunnerEnvironment = {
  resolve: () => void
  reject: (error: any) => void
  helpers: TestHelpers
  generator: Generator
}

/** @internal */
type TestResult = {
  name: string
  ok: boolean
  error?: string
  stack?: string
}

// TODO: move this to .proto
export type TestingModule = {
  logResult(data: TestResult): Promise<any>
  plan(data: { tests: { name: string }[] }): Promise<any>
  setCameraPosition(transform: Pick<TransformType, 'position' | 'rotation'>): Promise<any>
}