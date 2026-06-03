import { Atom } from "../../misc/atom"
import { Avatar } from "@dcl/schemas"
import { commsLogger } from "./types"
import { CommsTransportWrapper, RoomConnectionStatus } from "./CommsTransportWrapper"

// this function creates a controller for profile synchronization and announcement.
export function createNetworkedProfileSystem(transport: CommsTransportWrapper) {
  const currentAvatar = Atom<Avatar>()
  let lastReport = performance.now()
  
  wireTransportEvents(transport)
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
    const avatar = currentAvatar.getOrNull()

    if (!avatar) return
    if (shouldDiscard()) return

    // then send the profile message to the transports
    if (transport.state === RoomConnectionStatus.CONNECTED) {
      transport.sendProfileMessage({ profileVersion: avatar.version })
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

    const avatarClone: Avatar = structuredClone(avatar)

    // the address is sent to the network in lower case this is for some reason required for
    // the unity renderer to work
    avatarClone.userId = avatarClone.userId.toLowerCase()
    avatarClone.ethAddress = avatarClone.ethAddress.toLowerCase()

    transport.sendProfileResponse({
      baseUrl: "https://peer.decentraland.org/content/contents/",
      serializedProfile: JSON.stringify(avatarClone)
    })
  }

  return {
    update() {},
    lateUpdate,
    setAvatar,
    currentAvatar,
  }
}