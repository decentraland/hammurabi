import * as proto from '@dcl/protocol/out-ts/decentraland/kernel/comms/rfc4/comms.gen'
import {
  ConnectionState,
  DataPacket_Kind,
  DisconnectReason,
  Participant,
  RemoteParticipant,
  Room,
  RoomEvent,
  LocalAudioTrack,
  ParticipantEvent,
  RemoteAudioTrack,
  RemoteTrack,
  RemoteTrackPublication,
  Track,
  MediaDeviceFailure
} from 'livekit-client'
import mitt from 'mitt'
import { CommsTransportEvents, MinimumCommunicationsTransport, SendHints, commsLogger } from '../types'
import { Vector3, Quaternion, Engine, Scene } from '@babylonjs/core'
import { AddToggle, guiPanel } from '../../../babylon/visual/ui'
import { Checkbox } from '@babylonjs/gui'
import { Atom } from '../../../misc/atom'
import { updateVideoTexture } from './livekit-video-texture'

export type LivekitConfig = {
  url: string
  token: string
  scene: Scene
  microphone: Atom<MediaStream>
  audioContext: AudioContext
}

export type VoiceSpatialParams = {
  position: [number, number, number]
  orientation: [number, number, number]
}

const MAXIMUM_NETWORK_MSG_LENGTH = 30_000

export class LivekitAdapter implements MinimumCommunicationsTransport {
  public readonly events = mitt<CommsTransportEvents>()
  public voiceHandler?: VoiceHandler

  private disposed = false
  private readonly room: Room
  muteCheck?: Checkbox

  constructor(private config: LivekitConfig) {
    this.room = new Room({ expWebAudioMix: { audioContext: this.config.audioContext } })

    Object.assign(globalThis, { Engine, livekit: this })

    const voiceHandler = this.voiceHandler = createLiveKitVoiceHandler(this.room, config.scene)

    if (typeof OffscreenCanvas !== 'undefined') {
      this.muteCheck = AddToggle('Mute microphone (Livekit)', guiPanel(config.scene))
      this.muteCheck.isEnabled = !!config.microphone.getOrNull()
      this.muteCheck.isChecked = true

      // enable checkbox only when we have a microphone available
      config.microphone.observable.add((stream) => {
        this.muteCheck!.isEnabled = true
        voiceHandler.setInputStream(stream)
      })

      this.muteCheck.onIsCheckedChangedObservable.add((v) => {
        voiceHandler.setRecording(!v)
      })
    }

    this.room.startAudio().catch(commsLogger.error)

    this.room
      .on(RoomEvent.MediaDevicesError, (e: Error) => {
        const failure = MediaDeviceFailure.getFailure(e);
        commsLogger.error('media device failure', failure);
      })
      .on(RoomEvent.ParticipantConnected, (_: RemoteParticipant) => {
        commsLogger.log(this.room.name, 'remote participant joined', _.identity)
      })
      .on(RoomEvent.ParticipantDisconnected, (_: RemoteParticipant) => {
        this.events.emit('PEER_DISCONNECTED', {
          address: _.identity
        })
        commsLogger.log(this.room.name, 'remote participant left', _.identity)
      })
      .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        commsLogger.log(this.room.name, 'connection state changed', state)
      })
      .on(RoomEvent.Disconnected, (reason: DisconnectReason | undefined) => {
        if (this.disposed) {
          return
        }

        commsLogger.log(this.room.name, 'disconnected from room', reason, {
          liveKitParticipantSid: this.room.localParticipant.sid,
          liveKitRoomSid: this.room.sid
        })
        const kicked = reason === DisconnectReason.DUPLICATE_IDENTITY
        this.doDisconnect(kicked).catch((err) => {
          commsLogger.error(`error during disconnection ${err.toString()}`)
        })
      })
      .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: Participant, _?: DataPacket_Kind) => {
        if (participant) {
          this.handleMessage(participant.identity, payload)
        }
      })
  }

  async connect(): Promise<void> {
    await this.room.connect(this.config.url, this.config.token, { autoSubscribe: true })
    await this.room.engine.waitForPCInitialConnection()
    commsLogger.log(this.room.name, `Connected to livekit room ${this.room.name}`)
  }

  async send(data: Uint8Array, { reliable }: SendHints): Promise<void> {
    if (this.disposed) {
      return
    }

    const state = this.room.state

    if (data.length > MAXIMUM_NETWORK_MSG_LENGTH) {
      const message = proto.Packet.decode(data)
      commsLogger.error('Skipping big message over comms', message)
      return
    }

    if (state !== ConnectionState.Connected) {
      return
    }

    try {
      await this.room.localParticipant.publishData(data, reliable ? DataPacket_Kind.RELIABLE : DataPacket_Kind.LOSSY)
    } catch (err: any) {
      // NOTE: for tracking purposes only, this is not a "code" error, this is a failed connection or a problem with the livekit instance
      await this.disconnect()
    }
  }

  async disconnect() {
    return this.doDisconnect(false)
  }

  async doDisconnect(kicked: boolean) {
    if (this.disposed) {
      return
    }

    this.muteCheck?.dispose()

    this.disposed = true
    await this.room.disconnect().catch(commsLogger.error)
    this.events.emit('DISCONNECTION', { kicked })
  }

  setVoicePosition(address: string, position: proto.Position) {
    this.voiceHandler?.setVoicePosition(address, position)
  }

  handleMessage(address: string, data: Uint8Array) {
    this.events.emit('message', {
      address,
      data
    })
  }
}

type ParticipantInfo = {
  participant: RemoteParticipant
  tracks: Map<string, ParticipantTrack>
}

type ParticipantTrack = {
  track: LocalAudioTrack | RemoteAudioTrack
  streamNode: MediaStreamAudioSourceNode
  panNode: PannerNode
}


export type VoiceHandler = {
  // UI Methods
  // setTalking is called from the UI or keyboard to broadcast audio
  setRecording(recording: boolean): void

  // used to know if a user is talking or not, for the UI
  onUserTalking(cb: (userId: string, talking: boolean) => void): void

  onError(cb: (message: string) => void): void

  onRecording(cb: (recording: boolean) => void): void

  setInputStream(stream: MediaStream): Promise<void>

  setVoicePosition(address: string, position: proto.Position): void

  hasInput(): boolean
}


export function createLiveKitVoiceHandler(room: Room, scene: Scene): VoiceHandler {
  let recordingListener: ((state: boolean) => void) | undefined
  let errorListener: ((message: string) => void) | undefined

  let validInput = false
  let onUserTalkingCallback: (userId: string, talking: boolean) => void = () => { }

  const participantsInfo = new Map<string, ParticipantInfo>()

  function getParticipantInfo(participant: RemoteParticipant): ParticipantInfo {
    let $: ParticipantInfo | undefined = participantsInfo.get(participant.identity)

    if (!$) {
      $ = {
        participant,
        tracks: new Map()
      }
      participantsInfo.set(participant.identity, $)

      participant.on(ParticipantEvent.IsSpeakingChanged, (talking: boolean) => {
        const audioPublication = participant.getTrack(Track.Source.Microphone)
        if (audioPublication && audioPublication.track) {
          const audioTrack = audioPublication.track as RemoteAudioTrack
          onUserTalkingCallback(participant.identity, audioTrack.isMuted ? false : talking)
        }
      })

      commsLogger.log('Adding participant', participant.identity)
    }

    return $
  }

  function setupAudioTrackForRemoteTrack(track: RemoteAudioTrack): ParticipantTrack {
    commsLogger.log('Adding media track', track.sid)
    const streamNode = Engine.audioEngine!.audioContext!.createMediaStreamSource(track.mediaStream!)
    const panNode = Engine.audioEngine!.audioContext!.createPanner()

    streamNode.connect(panNode)
    panNode.connect(Engine.audioEngine!.masterGain)

    panNode.panningModel = 'equalpower'
    panNode.distanceModel = 'inverse'

    // use refDistance == maxDistance to disable distance attenuation
    // this variable gets updated when the user moves to enable positional falloff
    panNode.refDistance = 10000
    panNode.maxDistance = 10000
    panNode.coneOuterAngle = 360
    panNode.coneInnerAngle = 180
    panNode.coneOuterGain = 0.9
    panNode.rolloffFactor = 1.0

    return {
      panNode,
      streamNode,
      track
    }
  }

  function handleTrackSubscribed(
    track: RemoteTrack,
    _publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) {
    const info = getParticipantInfo(participant)
    const trackId = track.sid
    if (trackId && !info.tracks.has(trackId) && track.kind === Track.Kind.Audio && track.mediaStream) {
      info.tracks.set(trackId, setupAudioTrackForRemoteTrack(track as RemoteAudioTrack))
    } else if (trackId && !info.tracks.has(trackId) && track.kind === Track.Kind.Video && track.mediaStream) {
      try {
        updateVideoTexture(scene, track, participant)
      } catch (err) {
        commsLogger.error(err)
        debugger
      }
    }
  }

  function handleTrackUnsubscribed(
    remoteTrack: RemoteTrack,
    _publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) {
    if (remoteTrack.kind !== Track.Kind.Audio) {
      return
    }

    const info = getParticipantInfo(participant)

    for (const [trackId, track] of info.tracks) {
      if (trackId === remoteTrack.sid) {
        track.panNode.disconnect()
        track.streamNode.disconnect()
        break
      }
    }
  }

  function handleMediaDevicesError() {
    if (errorListener) errorListener('Media Device Error')
  }

  room
    .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
    .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
    .on(RoomEvent.MediaDevicesError, handleMediaDevicesError)

  commsLogger.log('voice handler initialized')

  return {
    setRecording(recording) {
      room.localParticipant
        .setMicrophoneEnabled(recording)
        .then(() => {
          if (recordingListener) {
            recordingListener(recording)
          }
        })
        .catch((err) => commsLogger.error('Error: ', err, ', recording=', recording))
    },
    onUserTalking(cb) {
      onUserTalkingCallback = cb
    },
    onRecording(cb) {
      recordingListener = cb
    },
    onError(cb) {
      errorListener = cb
    },
    setInputStream: async (localStream) => {
      try {
        await room.switchActiveDevice('audioinput', localStream.id)
        validInput = true
      } catch (e) {
        validInput = false
        if (errorListener) errorListener('setInputStream catch' + JSON.stringify(e))
      }
    },
    hasInput: () => {
      return validInput
    },
    setVoicePosition(address: string, position: proto.Position) {
      const audioContext = Engine.audioEngine!.audioContext!

      const participantInfo = participantsInfo.get(address)

      if (participantInfo) {
        for (const [_, { panNode }] of participantInfo.tracks) {
          // set a reasonable refDistance to enable positional falloff
          // by default refDistance is 10000 which disables distance attenuation
          panNode.refDistance = 5
          if (panNode.positionX) {
            panNode.positionX.setValueAtTime(position.positionX, audioContext.currentTime)
            panNode.positionY.setValueAtTime(position.positionY, audioContext.currentTime)
            panNode.positionZ.setValueAtTime(position.positionZ, audioContext.currentTime)
          } else {
            panNode.setPosition(position.positionX, position.positionY, position.positionZ)
          }

          if (panNode.orientationX) {
            panNode.orientationX.setValueAtTime(0, audioContext.currentTime)
            panNode.orientationY.setValueAtTime(0, audioContext.currentTime)
            panNode.orientationZ.setValueAtTime(1, audioContext.currentTime)
          } else {
            panNode.setOrientation(0, 0, 1)
          }
        }
      }
    }
  }
}

export function getSpatialParamsFor(position: proto.Position): VoiceSpatialParams {
  const orientation = Vector3.Backward().applyRotationQuaternion(
    Quaternion.FromArray([position.rotationX, position.rotationY, position.rotationZ, position.rotationW])
  )

  return {
    position: [position.positionX, position.positionY, position.positionZ],
    orientation: [orientation.x, orientation.y, orientation.z]
  }
}
