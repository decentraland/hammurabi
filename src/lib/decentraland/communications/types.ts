import { Atom } from "../../misc/atom"
import { Emitter } from "mitt"
import { createLogger } from "../../misc/logger"
import { Position } from "@dcl/protocol/out-js/decentraland/kernel/comms/rfc4/comms.gen"

export type CommsAdapter = {
  desiredTransports: Atom<[{ url: string; sceneId: string }]>
  reportPosition: (position: { x: number, y: number, z: number }) => void
  disconnect(): void
}

export type CommsTransportEvents = {
  DISCONNECTION: TransportDisconnectedEvent
  PEER_CONNECTED: PeerConnectedEvent
  PEER_DISCONNECTED: PeerDisconnectedEvent
  message: TransportMessageEvent
  error: Error
}

// this type abstracts every transport
export interface MinimumCommunicationsTransport {
  /**
   * The .send method is used to send information to all the peers
   * connected to this transport. The hints can be used to tweak the
   * default behavior of the transport.
   */
  send(data: Uint8Array, hints: SendHints, destination: string[]): void
  /**
   * The .connect() method resolves when the connection with the
   * transport was successful and it is ready to send and receive
   * messages.
   * 
   * This method returns a set of connected peerIdentities.
   */
  connect(): Promise<void>
  /**
   * The .disconnect() method can optionally receive an error that will
   * be bubbled up in the DISCONNECTED event. It should be used to
   * notify the user about possible network errors and to help with the
   * UX of the explorer.
   */
  disconnect(error?: Error): Promise<void>

  /**
   * Inform the voice handler (owned by the transport) about the position of a peer.
   */
  setVoicePosition(address: string, position: Position): void

  /**
   * Event emitter (mitt) with all the events produced by the transport.
   */
  events: Emitter<CommsTransportEvents>
}

export type SendHints = { reliable: boolean }

// DISCONNECTION
export type TransportDisconnectedEvent = {
  // Whether or no the reason of disconnection was that we logged in on
  // a different session
  kicked: boolean
  // Optional error
  error?: Error
}

// PEER_CONNECTED
export type PeerConnectedEvent = {
  // The ethereum address of the connected peer
  address: string
}

// PEER_DISCONNECTED
export type PeerDisconnectedEvent = {
  // The ethereum address of the disconnected peer
  address: string
}

// message
export type TransportMessageEvent = {
  // The ethereum address of the sender
  address: string
  data: Uint8Array
}

export const commsLogger = createLogger('📡 Comms')