import { Position } from "@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen"
import { CommsTransportWrapper, RoomConnectionStatus } from "./CommsTransportWrapper"
import { Quaternion, Vector3 } from "@babylonjs/core"
import { receivePeerDisconnected, receivePeerPosition, receiveProfileAnnounce, receiveProfileRequest, receiveProfileResponse } from "./handlers"

export function wireTransportEvents(transport: CommsTransportWrapper) {
  transport.events.on('PEER_DISCONNECTED', (event) => unwrapPromise(receivePeerDisconnected(event.address, transport)))
  transport.events.on('position', (event) => unwrapPromise(receivePeerPosition(event, transport)))
  transport.events.on('profileMessage', (event) => unwrapPromise(receiveProfileAnnounce(event, transport)))
  transport.events.on('profileRequest', (event) => unwrapPromise(receiveProfileRequest(event, transport)))
  transport.events.on('profileResponse', (event) => unwrapPromise(receiveProfileResponse(event, transport)))
}

function unwrapPromise(promise: Promise<any>) {
  promise.catch((e) => console.error(e))
}

// force max of 10Hz
const MAX_POSITIONS_PER_SECOND = 10

// this function generates a delegate that filters by time and limits position reports to 10Hz
export function createPositionReporter(transports: () => Iterable<CommsTransportWrapper>) {
  let globalPositionIndex = 0

  let lastReport = performance.now()

  function shouldDiscard() {
    const now = performance.now()
    if ((now - lastReport) < (1000 / MAX_POSITIONS_PER_SECOND)) {
      return true
    }
    lastReport = now
    return false
  }

  return function sendCurrentPosition(position: Vector3, rotation: Quaternion, forcePosition: boolean) {
    globalPositionIndex++

    if (!forcePosition && shouldDiscard()) return

    const positionReport: Position = {
      index: globalPositionIndex,
      positionX: position.x,
      positionY: position.y,
      positionZ: position.z,
      rotationX: rotation.x,
      rotationY: rotation.y,
      rotationZ: rotation.z,
      rotationW: rotation.w,
    }

    for (const it of transports()) {
      if (it.state === RoomConnectionStatus.CONNECTED) {
        it.sendPositionMessage(positionReport)
      }
    }
  }
}