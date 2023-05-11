import { Position } from "@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen"
import { CommsTransportWrapper, RoomConnectionStatus } from "./CommsTransportWrapper"
import { FreeCamera, Quaternion, Vector3 } from "@babylonjs/core"
import { DecentralandSystem } from "../system"
import { PLAYER_HEIGHT } from "../../babylon/scene/logic/static-entities"

export type ReportPositionSystem = DecentralandSystem & {
  reportPosition(position: Vector3, rotation: Quaternion, forcePosition: boolean): void
}

// this function generates a delegate that filters by time and limits position reports to 10Hz
export function createCommunicationsPositionReportSystem(transports: () => Iterable<CommsTransportWrapper>, firstPersonCamera: FreeCamera): ReportPositionSystem {
  // force max of 10Hz
  const MAX_POSITIONS_PER_SECOND = 10

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

  function reportPosition(position: Vector3, rotation: Quaternion, forcePosition: boolean) {
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

  if (!firstPersonCamera.rotationQuaternion) firstPersonCamera.rotationQuaternion = Quaternion.Identity()

  return {
    update() {
      // report the position of the first person camera to all transports
      reportPosition(firstPersonCamera.globalPosition.subtract(new Vector3(0, PLAYER_HEIGHT, 0)), firstPersonCamera.rotationQuaternion, false)
    },
    reportPosition
  }
}