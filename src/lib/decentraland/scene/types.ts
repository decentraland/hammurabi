import { CrdtGetStateResponse, CrdtMessageFromRendererRequest, CrdtMessageFromRendererResponse } from "@dcl/protocol/out-js/decentraland/kernel/apis/engine_api.gen"

/**
 * The scenes in any renderer implementing the Decentraland Protocol are controlled
 * by the scripting host (the JS vm). Each host should run its own (game) loop,
 * and call the .onUpdate function of the scene, its result is a promise, because
 * as part of the onUpdate, the scene code sends all the CRDT updates to the renderer
 * and awaits its response. The response may be delayed a couple of "rendering frames",
 * generating the need of asynchronous code.
 * 
 * The EngineApiInterface exposes the two functions required by the scene via
 *   require("~system/EngineApi")
 * to articulate the previously described behaviors. To gain more details about
 * the semantics of the messages, refer to
 * 
 * @ADR https://adr.decentraland.org/adr/ADR-133 - Scene runtime definition
 * @ADR https://adr.decentraland.org/adr/ADR-148 - Synchronization of CRDT messages between scenes and Renderer
 * 
 * This type is defined at https://github.com/decentraland/protocol/blob/d0a21d73e4d50e6d94f161269c021688ef719083/proto/decentraland/kernel/apis/engine_api.proto#L215
 */
export type EngineApiInterface = {
  /**
   * The crdtGetState function is used to hydrate the state of the SDK engine
   * and send information about static entities. i.e. the CameraEntity. It must
   * also be used in cases where the scene runtime is unloaded and reloaded,
   * also known as "hot reloading".
   * 
   * This function is suggested in ADR-133 in the "GetInitialState" stage
   */
  crdtGetState(): Promise<CrdtGetStateResponse>
  /**
   * The crdtSendToRenderer function is executed every tick of the scene, the payload
   * includes all the updates from the scripted scene, its result includes all the updates
   * from the renderer engine for the scripted scene e.g. input events, camera position updates,
   * etc.
   */
  crdtSendToRenderer(payload: CrdtMessageFromRendererRequest): Promise<CrdtMessageFromRendererResponse>
}


