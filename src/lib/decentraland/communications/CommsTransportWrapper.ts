import * as proto from '@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen'
import mitt from 'mitt'
import { CommsTransportEvents, MinimumCommunicationsTransport, TransportMessageEvent } from './types'
import { Vector3 } from '@babylonjs/core'

export enum RoomConnectionStatus {
  NONE,
  CONNECTING,
  CONNECTED,
  DISCONNECTED
}

export type TransportPacket<T> = {
  // sender address
  address: string
  // [TODO] add local time in which the message was sent
  //   senderLocalTime: number
  data: T
}

export type CommsEvents = Pick<CommsTransportEvents, 'DISCONNECTION' | 'PEER_DISCONNECTED'> & {
  // ADR-104 messages
  sceneMessageBus: TransportPacket<proto.Scene>
  chatMessage: TransportPacket<proto.Chat>
  profileMessage: TransportPacket<proto.AnnounceProfileVersion>
  position: TransportPacket<proto.Position>
  voiceMessage: TransportPacket<proto.Voice>
  profileResponse: TransportPacket<proto.ProfileResponse>
  profileRequest: TransportPacket<proto.ProfileRequest>
}

/**
 * This class implements ADR-104 on top of a MinimumCommunicationsTransport. The idea behind it is
 * to serve as a reference implementation for comss. MinimumCommunicationsTransport can be an IRC
 * server, an echo server, a mocked implementation or WebSocket among many others.
 */
export class CommsTransportWrapper {
  readonly events = mitt<CommsEvents>()
  public state: RoomConnectionStatus = RoomConnectionStatus.NONE

  constructor(private transport: MinimumCommunicationsTransport) {
    this.transport.events.on('message', this.handleMessage.bind(this))
    this.transport.events.on('DISCONNECTION', (event) => this.events.emit('DISCONNECTION', event))
    this.transport.events.on('PEER_DISCONNECTED', (event) => this.events.emit('PEER_DISCONNECTED', event))
  }

  async connect(): Promise<void> {
    try {
      this.state = RoomConnectionStatus.CONNECTING
      await this.transport.connect()
      this.state = RoomConnectionStatus.CONNECTED
    } catch (e: any) {
      this.state = RoomConnectionStatus.DISCONNECTED
      this.events.emit('DISCONNECTION', { error: e, kicked: false })
      console.error(e)
    }
  }

  sendPositionMessage(position: proto.Position): Promise<void> {
    return this.sendMessage(false, {
      message: {
        $case: 'position',
        position
      }
    })
  }
  sendParcelSceneMessage(scene: proto.Scene): Promise<void> {
    return this.sendMessage(false, { message: { $case: 'scene', scene } })
  }
  sendProfileMessage(profileVersion: proto.AnnounceProfileVersion): Promise<void> {
    return this.sendMessage(false, { message: { $case: 'profileVersion', profileVersion } })
  }
  sendProfileRequest(profileRequest: proto.ProfileRequest): Promise<void> {
    return this.sendMessage(false, { message: { $case: 'profileRequest', profileRequest } })
  }
  sendProfileResponse(profileResponse: proto.ProfileResponse): Promise<void> {
    return this.sendMessage(false, { message: { $case: 'profileResponse', profileResponse } })
  }
  sendChatMessage(chat: proto.Chat): Promise<void> {
    return this.sendMessage(true, { message: { $case: 'chat', chat } })
  }
  sendVoiceMessage(voice: proto.Voice): Promise<void> {
    return this.sendMessage(false, { message: { $case: 'voice', voice } })
  }

  async disconnect() {
    await this.transport.disconnect()
  }

  private handleMessage({ data, address }: TransportMessageEvent) {
    const { message } = proto.Packet.decode(data)

    if (!message) {
      return
    }

    switch (message.$case) {
      case 'position': {
        this.transport.setVoicePosition(address, message.position)
        this.events.emit('position', { address, data: message.position })
        break
      }
      case 'scene': {
        this.events.emit('sceneMessageBus', { address, data: message.scene })
        break
      }
      case 'chat': {
        this.events.emit('chatMessage', { address, data: message.chat })
        break
      }
      case 'voice': {
        this.events.emit('voiceMessage', { address, data: message.voice })
        break
      }
      case 'profileRequest': {
        this.events.emit('profileRequest', {
          address,
          data: message.profileRequest
        })
        break
      }
      case 'profileResponse': {
        this.events.emit('profileResponse', {
          address,
          data: message.profileResponse
        })
        break
      }
      case 'profileVersion': {
        this.events.emit('profileMessage', {
          address,
          data: message.profileVersion
        })
        break
      }
    }
  }

  private async sendMessage(reliable: boolean, topicMessage: proto.Packet) {
    if (Object.keys(topicMessage).length === 0) {
      throw new Error('Invalid empty message')
    }
    const bytes = proto.Packet.encode(topicMessage as any).finish()
    if (!this.transport) debugger
    this.transport.send(bytes, { reliable })
  }
}
