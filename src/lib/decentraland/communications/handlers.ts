import * as proto from "@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen";
import { CommsTransportWrapper, TransportPacket } from "./CommsTransportWrapper";
import { SceneContext } from "../../babylon/scene/scene-context";
import { userEntity } from "../../../explorer/state";
import { playerIdentityDataComponent } from "../sdk-components/engine-info copy";

export async function receiveProfileAnnounce(packet: TransportPacket<proto.AnnounceProfileVersion>, transport: CommsTransportWrapper) {

}

export async function receiveProfileRequest(packet: TransportPacket<proto.ProfileRequest>, transport: CommsTransportWrapper) {
  const identity = await userEntity.deref()
  if (packet.data.address.toLowerCase() === identity.address.toLowerCase()) {
    // TODO: debounce this response
    sendLocalProfile(transport)
  }
}

export async function receiveProfileResponse(packet: TransportPacket<proto.ProfileResponse>, transport: CommsTransportWrapper) {

}

export async function receivePeerPosition(packet: TransportPacket<proto.Position>, transport: CommsTransportWrapper) {

}

export async function receivePeerDisconnected(address: string, transport: CommsTransportWrapper) {

}

function sendLocalProfile(transport: CommsTransportWrapper) {

}
