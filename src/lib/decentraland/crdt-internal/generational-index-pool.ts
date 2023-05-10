import { ByteBuffer } from "../ByteBuffer"
import { DeleteEntity } from "../crdt-wire-protocol"
import { Entity } from "../types"

export const MAX_U16 = 0xffff
export const MAX_ENTITY_NUMBER = MAX_U16
const MASK_UPPER_16_ON_32 = 0xffff0000

export namespace EntityUtils {
  /**
   * @returns [entityNumber, entityVersion]
   */
  export function fromEntityId(entityId: Entity): [number, number] {
    return [(entityId & MAX_U16) >>> 0, (((entityId & MASK_UPPER_16_ON_32) >> 16) & MAX_U16) >>> 0]
  }

  /**
   * @returns compound number from entityNumber and entityVerison
   */
  export function toEntityId(entityNumber: number, entityVersion: number): Entity {
    return (((entityNumber & MAX_U16) | ((entityVersion & MAX_U16) << 16)) >>> 0) as Entity
  }
}

// creates a pool of used entity numbers and exposes functions to get
// and release entities using their generational index
export function createGenerationalIndexPool(from: Entity, to: Entity) {
  // this is a stack
  const freeEntityNumbers: number[] = []
  const usedEntityNumbers = new Set<number>()
  const generations = new Map<Entity, number>()
  const deletedAtTick = new Map<Entity, number>()
  let currentTick = 0

  // prepopulating the pool may not be the best idea in terms of performance and memory
  // but it is the clearest implementation possible
  for (let i = from; i < to; i++) {
    freeEntityNumbers.push(i)
    generations.set(i, -1)
  }

  // increments the generation of an entity number and returns the new generation
  function incrementGeneration(num: number): number {
    const curGen = generations.get(num)!
    const newGen = curGen + 1
    generations.set(num, newGen)
    return newGen
  }

  return {
    getFreeEntity() {
      if (freeEntityNumbers.length === 0) {
        throw new Error('No free entities available')
      }
      const entityNumber = freeEntityNumbers.pop()!
      usedEntityNumbers.add(entityNumber)

      const gen = incrementGeneration(entityNumber)

      return EntityUtils.toEntityId(entityNumber, gen)
    },
    hasFreeEntities() {
      return freeEntityNumbers.length > 0
    },
    runTick() {
      currentTick++
    },
    deleteEntity(entity: Entity) {
      const [num, gen] = EntityUtils.fromEntityId(entity)
      const curGen = generations.get(num) ?? 0
      if (curGen <= gen) {
        // save the bigger generation for this number
        generations.set(num, gen)
      }
      // only free the number if the generation matches
      if (curGen == gen && usedEntityNumbers.has(num)) {
        freeEntityNumbers.push(num)
        usedEntityNumbers.delete(num)
        deletedAtTick.set(entity, currentTick)
      }
    },
    getCrdtUpdates(outBuffer: ByteBuffer, fromTick: number): number {
      let biggestTick = fromTick

      for (const [entityId, tick] of deletedAtTick) {
        if (tick <= fromTick) continue
        if (biggestTick < tick) biggestTick = tick
        DeleteEntity.write({ entityId }, outBuffer)
      }

      return biggestTick
    }
  }
}