import { Entity } from "../types"

// Entity utilities for bit-packed entity numbers and versions
const MAX_U16 = 0xffff
const MASK_UPPER_16_ON_32 = 0xffff0000

export namespace EntityUtils {
  export function fromEntityId(entityId: Entity): [number, number] {
    return [(entityId & MAX_U16) >>> 0, (((entityId & MASK_UPPER_16_ON_32) >> 16) & MAX_U16) >>> 0]
  }

  export function toEntityId(entityNumber: number, entityVersion: number): Entity {
    return (((entityNumber & MAX_U16) | ((entityVersion & MAX_U16) << 16)) >>> 0) as Entity
  }
}

// Based on Unity's SpecialEntitiesID constants
const PLAYER_ENTITY = 1
const OTHER_PLAYER_ENTITIES_FROM = 32
const OTHER_PLAYER_ENTITIES_TO = 256

export class PlayerEntityManager {
  // Set of allocated entities for efficient checking
  private allocatedEntities = new Set<Entity>()
  
  // Map from player address to entity ID
  private addressToEntityMap = new Map<string, Entity>()
  
  // Map from entity ID to player address
  private entityToAddressMap = new Map<Entity, string>()
  
  // Track entity versions for reuse (entity number -> highest version)
  private entityVersions = new Map<number, number>()
  
  // Next available entity number to allocate
  private nextEntityNumber = OTHER_PLAYER_ENTITIES_FROM

  /**
   * Allocates a reserved entity ID for a player address.
   * Returns the local player entity (1) for the local player, or a versioned entity (32-255) for remote players.
   */
  allocateEntityForPlayer(address: string, isLocalPlayer: boolean = false): Entity | null {
    // Normalize address to lowercase to match Unity behavior
    const normalizedAddress = address.toLowerCase()
    
    // Return existing entity if already allocated
    if (this.addressToEntityMap.has(normalizedAddress)) {
      return this.addressToEntityMap.get(normalizedAddress)!
    }
    
    let entityId: Entity
    
    if (isLocalPlayer) {
      entityId = PLAYER_ENTITY
      this.addressToEntityMap.set(normalizedAddress, entityId)
      this.entityToAddressMap.set(entityId, normalizedAddress)
      console.log(`Allocated local player entity ${entityId} for ${normalizedAddress}`)
      return entityId
    }
    
    // For remote players, try to reuse an entity with incremented version first
    for (const [entityNumber, currentVersion] of this.entityVersions) {
      if (entityNumber >= OTHER_PLAYER_ENTITIES_FROM && entityNumber < OTHER_PLAYER_ENTITIES_TO) {
        if (currentVersion < MAX_U16) {
          const newEntity = EntityUtils.toEntityId(entityNumber, currentVersion + 1)
          if (!this.allocatedEntities.has(newEntity)) {
            this.entityVersions.set(entityNumber, currentVersion + 1)
            this.allocatedEntities.add(newEntity)
            this.addressToEntityMap.set(normalizedAddress, newEntity)
            this.entityToAddressMap.set(newEntity, normalizedAddress)
            console.log(`Reused entity ${entityNumber} version ${currentVersion + 1} (id: ${newEntity}) for ${normalizedAddress}`)
            return newEntity
          }
        }
      }
    }
    
    // Allocate new entity number if no reusable entities available
    if (this.nextEntityNumber < OTHER_PLAYER_ENTITIES_TO) {
      const entityNumber = this.nextEntityNumber++
      const entityVersion = 0
      const newEntity = EntityUtils.toEntityId(entityNumber, entityVersion)
      
      this.entityVersions.set(entityNumber, entityVersion)
      this.allocatedEntities.add(newEntity)
      this.addressToEntityMap.set(normalizedAddress, newEntity)
      this.entityToAddressMap.set(newEntity, normalizedAddress)
      return newEntity
    }
    
    console.warn('No available entity slots for remote players')
    return null
  }
  
  /**
   * Frees the entity allocated to a player address
   */
  freeEntityForPlayer(address: string): void {
    const normalizedAddress = address.toLowerCase()
    const entityId = this.addressToEntityMap.get(normalizedAddress)
    
    if (entityId !== undefined) {
      // Don't free the local player entity, just clear mappings
      if (entityId === PLAYER_ENTITY) {
        this.addressToEntityMap.delete(normalizedAddress)
        this.entityToAddressMap.delete(entityId)
        console.log(`Cleared local player entity ${entityId} for ${normalizedAddress}`)
        return
      }
      
      // For remote player entities, remove from allocated set but keep version info
      const [entityNumber] = EntityUtils.fromEntityId(entityId)
      if (entityNumber >= OTHER_PLAYER_ENTITIES_FROM && entityNumber < OTHER_PLAYER_ENTITIES_TO) {
        this.allocatedEntities.delete(entityId)
        // Keep entityVersions entry for potential reuse with incremented version
      }
      
      this.addressToEntityMap.delete(normalizedAddress)
      this.entityToAddressMap.delete(entityId)      
    }
  }
  
  /**
   * Gets the player address for a given entity ID
   */
  getAddressForEntity(entityId: Entity): string | null {
    return this.entityToAddressMap.get(entityId) || null
  }
  
  /**
   * Gets the entity ID for a given player address
   */
  getEntityForAddress(address: string): Entity | null {
    const normalizedAddress = address.toLowerCase()
    return this.addressToEntityMap.get(normalizedAddress) || null
  }
  
  /**
   * Checks if an entity ID is a reserved player entity
   */
  isPlayerEntity(entityId: Entity): boolean {
    if (entityId === PLAYER_ENTITY) return true
    
    const [entityNumber] = EntityUtils.fromEntityId(entityId)
    return entityNumber >= OTHER_PLAYER_ENTITIES_FROM && entityNumber < OTHER_PLAYER_ENTITIES_TO
  }
  
  /**
   * Gets all allocated player entities
   */
  getAllPlayerEntities(): Map<Entity, string> {
    return new Map(this.entityToAddressMap)
  }
  
  /**
   * Gets entity state information for debugging
   */
  getEntityInfo(entityId: Entity): { number: number, version: number, allocated: boolean } {
    const [number, version] = EntityUtils.fromEntityId(entityId)
    return {
      number,
      version,
      allocated: this.allocatedEntities.has(entityId)
    }
  }
  
  /**
   * Clears all reserved entities (for cleanup)
   */
  clear(): void {
    this.allocatedEntities.clear()
    this.addressToEntityMap.clear()
    this.entityToAddressMap.clear()
    this.entityVersions.clear()
    this.nextEntityNumber = OTHER_PLAYER_ENTITIES_FROM
  }
  
  /**
   * Gets all allocated entities
   */
  getAllocatedEntities(): Set<Entity> {
    return new Set(this.allocatedEntities)
  }
}

// Singleton instance for global use
export const playerEntityManager = new PlayerEntityManager()