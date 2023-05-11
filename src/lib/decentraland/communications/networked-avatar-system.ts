import { Atom } from "../../misc/atom"
import { Avatar } from "@dcl/schemas"
import { commsLogger } from "./types"
import { CommsTransportWrapper, RoomConnectionStatus } from "./CommsTransportWrapper"

// this function creates a controller for avatar synchronization and announcement.
export function createNetworkedAvatarSystem(getTransports: () => Iterable<CommsTransportWrapper>) {
  const currentAvatar = Atom<Avatar>()
  const wiredTransports = new WeakSet<CommsTransportWrapper>()
  let lastReport = performance.now()

  // force max of 2Hz
  const MAX_AVATARS_PER_SECOND = 2

  function shouldDiscard() {
    const now = performance.now()
    if ((now - lastReport) < (1000 / MAX_AVATARS_PER_SECOND)) {
      return true
    }
    lastReport = now
    return false
  }

  function lateUpdate() {
    const transports = Array.from(getTransports())
    // first ensure the transports are all wired
    for (const it of transports) {
      if (!wiredTransports.has(it)) {
        wireTransportEvents(it)
        wiredTransports.add(it)
      }
    }

    const avatar = currentAvatar.getOrNull()

    if (!avatar) return
    if (shouldDiscard()) return

    // then send the profile message to the transports
    for (const it of transports) {
      if (it.state === RoomConnectionStatus.CONNECTED) {
        it.sendProfileMessage({ profileVersion: avatar.version })
      }
    }
  }

  function wireTransportEvents(transport: CommsTransportWrapper) {
    transport.events.on('profileRequest', async (packet) => {
      try {
        commsLogger.log('Responding to profile request', packet.data.address)
        const avatar = await currentAvatar.deref()
        if (packet.data.address.toLowerCase() === avatar.ethAddress.toLowerCase()) {
          sendLocalProfile(transport, avatar)
        }
      } catch (err) {
        commsLogger.error(err)
      }
    })
  }

  function setAvatar(avatar: Avatar) {
    const current = currentAvatar.getOrNull()
    currentAvatar.swap({ ...avatar, version: (current?.version ?? 0) + 1 })
    lastReport = 0
  }

  // TODO: debounce this response
  function sendLocalProfile(transport: CommsTransportWrapper, avatar: Avatar) {
    commsLogger.log('Responding to profile request')
    transport.sendProfileResponse({
      baseUrl: "https://peer.decentraland.org/content/contents/",
      serializedProfile: JSON.stringify(avatar)
    })
  }

  return {
    update() {},
    lateUpdate,
    setAvatar,
    currentAvatar,
  }
}