
/**
 * The following object specifies the global functions added to all scene runtimes
 * as defined in https://adr.decentraland.org/adr/ADR-133.
 * 
 * For now, we only map log, error and require. At this stage, fetch and WebSocket
 * are purposely left out of scope.
 **/
export type ProvideOptions = {
  // console.log
  log(...args: any[]): void
  // console.error
  error(...args: any[]): void
  // global Common.js-like require
  require(module: string): any
}

/**
 * This is the return type of a VM wrapper
 */
export type RunWithVmOptions = {
  /**
   * Evaluates code inside the VM
   */
  eval(code: string, filename?: string): void
  /**
   * Runs an update tick, calling the exports.onUpdate function as per ADR-133
   */
  onUpdate(dt: number): Promise<any>
  /**
   * Runs the exports.onStart function as per ADR-133
   */
  onStart(): Promise<void>
  /**
   * Used to configure the VM with custom handlers.
   */
  provide(opts: ProvideOptions): void
}

// TODO: This type exists because there is a missing reliable and recursive way to
// pass Uint8Array as object values from the VM context to the HOST context
export type MaybeUint8Array = Uint8Array | Record<string, number>