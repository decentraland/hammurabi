import { Quaternion, Vector3 } from "@babylonjs/core"
import { ReadWriteByteBuffer } from "../ByteBuffer"
import { ComponentDefinition } from "../crdt-internal/components"
import { createLwwStore } from "../crdt-internal/last-write-win-element-set"
import { playerIdentityDataComponent } from "../sdk-components/player-identity-data"
import { avatarBaseComponent } from "../sdk-components/avatar-base"
import { transformComponent } from "../sdk-components/transform-component"
import { Entity } from "../types"
import { CommsTransportWrapper } from "./CommsTransportWrapper"
import { StaticEntities } from "../../babylon/scene/logic/static-entities"
import { playerEntityManager } from "./player-entity-manager"

/**
 * Single avatar communication system that handles avatar entities for a specific scene transport.
 * This system manages player entities, profiles, and avatar data for multiplayer scenarios.
 */
export function createAvatarCommunicationSystem(transport: CommsTransportWrapper) {
  const PlayerIdentityData = createLwwStore(playerIdentityDataComponent)
  const AvatarBase = createLwwStore(avatarBaseComponent)
  const Transform = createLwwStore(transformComponent)
  const listOfComponentsToSynchronize: ComponentDefinition<any>[] = [PlayerIdentityData, AvatarBase, Transform]
  
  // Cache for profiles fetched from Catalyst
  const profileCache = new Map<string, {profile: any, version: number}>()
  
  function normalizeAddress(address: string) {
    return address.toLowerCase()
  }

  async function fetchProfileFromCatalyst(address: string, lambdasEndpoint?: string): Promise<any> {
    try {
      // Use lambdasEndpoint if provided, otherwise use default Catalyst
      const baseUrl = lambdasEndpoint || 'https://peer.decentraland.org'
      const response = await fetch(`${baseUrl}/lambdas/profiles?id=${address}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      
      const data: any = await response.json()
      return data[0].avatars?.[0] // Return the profile data
    } catch (error) {
      console.error('Failed to fetch profile from Catalyst:', error)
      throw error
    }
  }

  async function handleProfileVersionAnnouncement(
    entity: Entity, 
    address: string, 
    announcedVersion: number, 
    lambdasEndpoint?: string
  ) {
    const cached = profileCache.get(address)
    
    // Only fetch if we don't have this version cached
    if (!cached || cached.version < announcedVersion) {
      try {
        const profile = await fetchProfileFromCatalyst(address, lambdasEndpoint)
        
        if (profile && profile.version >= announcedVersion) {
          profileCache.set(address, {profile, version: profile.version})
          updatePlayerComponents(entity, address, profile)
                  }
      } catch (error) {
        console.error('Failed to handle profile version announcement:', error)
      }
    }
  }

  function updatePlayerComponents(entity: Entity, address: string, profile: any) {
    // Update PlayerIdentityData component (protobuf)
    PlayerIdentityData.createOrReplace(entity, { 
      address: address, 
      isGuest: !profile.hasConnectedWeb3 
    })
    
    // Update AvatarBase component (protobuf) 
    AvatarBase.createOrReplace(entity, {
      name: profile.name || 'Unknown',
      bodyShapeUrn: profile.avatar?.bodyShape || '',
      skinColor: profile.avatar?.skin?.color ? {
        r: profile.avatar.skin.color.r,
        g: profile.avatar.skin.color.g, 
        b: profile.avatar.skin.color.b
      } : { r: 0.8, g: 0.6, b: 0.4 }, // Default skin color
      eyesColor: profile.avatar?.eyes?.color ? {
        r: profile.avatar.eyes.color.r,
        g: profile.avatar.eyes.color.g,
        b: profile.avatar.eyes.color.b
      } : { r: 0.2, g: 0.5, b: 0.8 }, // Default eye color
      hairColor: profile.avatar?.hair?.color ? {
        r: profile.avatar.hair.color.r,
        g: profile.avatar.hair.color.g,
        b: profile.avatar.hair.color.b
      } : { r: 0.3, g: 0.2, b: 0.1 } // Default hair color
    })
  }

  function removePlayerEntity(entity: Entity, address: string) {
    for (const component of listOfComponentsToSynchronize) {
      component.entityDeleted(entity, true)
    }
    
    // Free the entity in the player entity manager
    playerEntityManager.freeEntityForPlayer(address)
    
    // Clear from profile cache
    const normalizedAddress = normalizeAddress(address)
    profileCache.delete(normalizedAddress)
  }

  function findPlayerEntityByAddress(address: string, createIfMissing: boolean): Entity | null {
    const normalizedAddress = normalizeAddress(address)
    
    // First check if we already have an entity allocated for this address
    let entity = playerEntityManager.getEntityForAddress(normalizedAddress)
    if (entity !== null) {
      return entity
    }

    if (!createIfMissing) return null

    // Allocate a new entity for this remote player
    entity = playerEntityManager.allocateEntityForPlayer(normalizedAddress, false)
    if (entity === null) {
      console.warn(`Failed to allocate entity for player ${normalizedAddress}`)
      return null
    }

    // Initialize with minimal identity data
    PlayerIdentityData.createOrReplace(entity, { address: normalizedAddress, isGuest: true })

    return entity
  }

  // Wire up transport events
  transport.events.on('PEER_CONNECTED', (event) => {
    const address = normalizeAddress(event.address)
    
    // Allocate entity for the new participant
    const entity = findPlayerEntityByAddress(address, true)
    if (entity) {      
      // Trigger initial profile fetch
      transport.events.emit('profileMessage', {
        address: address,
        data: {
          profileVersion: 1 // Initial version
        }
      })
    }
  })
  
  transport.events.on('PEER_DISCONNECTED', (event) => {
    // TODO: handle the .off event
    console.log('[PEER_DISCONNECTED]', event)
    const entity = findPlayerEntityByAddress(event.address, false)
    if (entity) {
      removePlayerEntity(entity, event.address)
    }
  })
  
  transport.events.on('position', (event) => {
    const entity = findPlayerEntityByAddress(event.address, true)
    if (entity) {
      Transform.createOrReplace(entity, {
        position: new Vector3(event.data.positionX, event.data.positionY, event.data.positionZ),
        scale: Vector3.One(),
        rotation: new Quaternion(event.data.rotationX, event.data.rotationY, event.data.rotationZ, event.data.rotationW),
        parent: StaticEntities.GlobalCenterOfCoordinates
      })
    }
  })
  
  // ADR-204: Use profileMessage for profile version announcements
  transport.events.on('profileMessage', async (event) => {
    const address = normalizeAddress(event.address)
    const announcedVersion = event.data.profileVersion
    
    const entity = findPlayerEntityByAddress(event.address, true)
    if (entity) {
      await handleProfileVersionAnnouncement(entity, address, announcedVersion)
    }
  })
  
  transport.events.on('chatMessage', (event) => {
    const address = normalizeAddress(event.address)
    const cached = profileCache.get(address)
    findPlayerEntityByAddress(event.address, true)

    const name = cached?.profile?.name || 'Unknown'
  })

  // Public API for managing the avatar system
  return {
    // Entity range this system manages
    range: [32, 256] as [number, number],
    
    // Update function to be called each frame
    update() {
      const updates = new ReadWriteByteBuffer()
      for (const component of listOfComponentsToSynchronize) {
        // Commit updates and clean dirty iterators
        component.dumpCrdtUpdates(updates)
      }
    },
    
    // Create subscription for CRDT synchronization
    createSubscription() {
      const state = new Map<ComponentDefinition<any>, number>(
        listOfComponentsToSynchronize.map(component => [component, -1])
      )

      return {
        range: [32, 256] as [number, number],
        dispose() {
          state.clear()
          // Clear player entity manager and profile cache
          playerEntityManager.clear()
          profileCache.clear()
        },
        getUpdates(writer: ReadWriteByteBuffer) {
          // Serialize all updates from the last tick until now
          for (const [component, tick] of state) {
            const newTick = component.dumpCrdtDeltas(writer, tick)
            state.set(component, newTick)
          }
        },
      }
    },
    
    // Cleanup function
    dispose() {
      playerEntityManager.clear()
      profileCache.clear()
    }
  }
}

export type AvatarCommunicationSystem = ReturnType<typeof createAvatarCommunicationSystem>