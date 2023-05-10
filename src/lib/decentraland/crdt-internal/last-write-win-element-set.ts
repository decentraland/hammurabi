import { Atom } from "../../misc/atom"
import { ByteBuffer, ReadWriteByteBuffer } from "../ByteBuffer"
import { PutComponentOperation, DeleteComponent, PutComponentMessageBody, DeleteComponentMessageBody, CrdtMessageType, CrdtMessageBody } from "../crdt-wire-protocol"
import { Entity } from "../types"
import { ComponentDeclaration, ComponentType, LastWriteWinElementSetComponentDefinition, SerDe } from "./components"
import { ProcessMessageResultType } from "./conflict-resolution"
import { dataCompare } from "./dataCompare"

export function incrementTimestamp(entity: Entity, timestamps: Map<Entity, number>): number {
  const newTimestamp = (timestamps.get(entity) || 0) + 1
  timestamps.set(entity, newTimestamp)
  return newTimestamp
}

export function createUpdateLwwFromCrdt<T>(
  componentId: number,
  timestamps: Map<Entity, number>,
  schema: SerDe<T>,
  data: Map<Entity, T>
) {
  /**
   * Process the received message only if the lamport number recieved is higher
   * than the stored one. If its lower, we spread it to the network to correct the peer.
   * If they are equal, the bigger raw data wins.

    * Returns the recieved data if the lamport number was bigger than ours.
    * If it was an outdated message, then we return void
    * @public
    */
  function crdtRuleForCurrentState(
    message: PutComponentMessageBody | DeleteComponentMessageBody
  ): ProcessMessageResultType {
    const { entityId, timestamp } = message
    const currentTimestamp = timestamps.get(entityId as Entity)

    // The received message is > than our current value, update our state.components.
    if (currentTimestamp === undefined || currentTimestamp < timestamp) {
      return ProcessMessageResultType.StateUpdatedTimestamp
    }

    // Outdated Message. Resend our state message through the wire.
    if (currentTimestamp > timestamp) {
      return ProcessMessageResultType.StateOutdatedTimestamp
    }

    // Deletes are idempotent
    if (message.type === CrdtMessageType.DELETE_COMPONENT && !data.has(entityId)) {
      return ProcessMessageResultType.NoChanges
    }

    let currentDataGreater = 0

    if (data.has(entityId)) {
      const writeBuffer = new ReadWriteByteBuffer()
      schema.serialize(data.get(entityId)!, writeBuffer)
      currentDataGreater = dataCompare(writeBuffer.toBinary(), (message as any).data || null)
    } else {
      currentDataGreater = dataCompare(null, (message as any).data)
    }

    if (currentDataGreater === 0) {
      // Same data, same timestamp.
      return ProcessMessageResultType.NoChanges
    } else if (currentDataGreater > 0) {
      // Current data is greater
      return ProcessMessageResultType.StateOutdatedData
    } else {
      // Curent data is lower
      return ProcessMessageResultType.StateUpdatedData
    }
  }

  return (msg: CrdtMessageBody, conflictResolutionByteBuffer: ByteBuffer): boolean => {
    if (msg.type !== CrdtMessageType.PUT_COMPONENT && msg.type !== CrdtMessageType.DELETE_COMPONENT)
      return true

    const action = crdtRuleForCurrentState(msg)
    const entityId = msg.entityId as Entity
    switch (action) {
      case ProcessMessageResultType.StateUpdatedData:
      case ProcessMessageResultType.StateUpdatedTimestamp: {
        timestamps.set(entityId, msg.timestamp)

        if (msg.type === CrdtMessageType.PUT_COMPONENT) {
          const buf = new ReadWriteByteBuffer(msg.data!)
          data.set(entityId, schema.deserialize(buf))
        } else {
          data.delete(entityId)
        }

        return true // change accepted
      }
      case ProcessMessageResultType.StateOutdatedTimestamp:
      case ProcessMessageResultType.StateOutdatedData: {
        const timestamp = timestamps.get(entityId)!

        if (data.has(entityId)) {
          const writeBuffer = new ReadWriteByteBuffer()
          schema.serialize(data.get(entityId)!, writeBuffer)

          // post conflict resolution update
          PutComponentOperation.write({ entityId, componentId, timestamp, data: writeBuffer.toBinary(), }, conflictResolutionByteBuffer)

          return false // change not accepted
        } else {
          // post conflict resolution update
          DeleteComponent.write({ entityId, componentId, timestamp }, conflictResolutionByteBuffer)

          return false // change not accepted
        }
      }
    }

    return true // change accepted
  }
}

export function createGetCrdtMessagesForLww<T>(
  componentId: number,
  updatedAtTick: Map<Entity, number>,
  timestamps: Map<Entity, number>,
  dirtyIterator: Set<Entity>,
  serde: SerDe<T>,
  data: Map<Entity, T>,
  currentTick: Atom<number>
) {
  return function (outBuffer: ByteBuffer) {
    const tick = 1 + (currentTick.getOrNull() ?? 0)
    currentTick.swap(tick)

    for (const entityId of dirtyIterator) {
      const timestamp = incrementTimestamp(entityId, timestamps)
      updatedAtTick.set(entityId, tick)
      if (data.has(entityId)) {
        const writeBuffer = new ReadWriteByteBuffer()
        serde.serialize(data.get(entityId)!, writeBuffer)
        PutComponentOperation.write({ entityId, componentId, timestamp, data: writeBuffer.toBinary(), }, outBuffer)
      } else {
        DeleteComponent.write({ entityId, componentId, timestamp }, outBuffer)
      }
    }
    dirtyIterator.clear()
  }
}

// this function writes the updates for the LWW component to the outBuffer using
// the entities that were updated after the fromTick value.
export function createGetCrdtMessagesForLwwWithTick<T>(
  componentId: number,
  updatedAtTick: Map<Entity, number>,
  timestamps: Map<Entity, number>,
  serde: SerDe<T>,
  data: Map<Entity, T>
) {
  return function (outBuffer: ByteBuffer, fromTick: number) {
    let biggestTick = fromTick

    for (const [entityId, tick] of updatedAtTick) {
      if (tick <= fromTick) continue
      if (biggestTick < tick) biggestTick = tick
      const timestamp = timestamps.get(entityId) ?? 0
      if (data.has(entityId)) {
        const writeBuffer = new ReadWriteByteBuffer()
        serde.serialize(data.get(entityId)!, writeBuffer)
        PutComponentOperation.write({ entityId, componentId, timestamp, data: writeBuffer.toBinary(), }, outBuffer)
      } else {
        DeleteComponent.write({ entityId, componentId, timestamp }, outBuffer)
      }
    }

    return biggestTick
  }
}

export function createLwwStore<T, Num extends number>(componentDeclaration: ComponentDeclaration<T, Num>): LastWriteWinElementSetComponentDefinition<T> {
  const data = new Map<Entity, T>()
  const dirtyIterator = new Set<Entity>()
  const timestamps = new Map<Entity, number>()
  const updatedAtTick = new Map<Entity, number>()
  const currentTick = Atom<number>(0)

  return {
    get componentId() {
      return componentDeclaration.componentId
    },
    get componentType() {
      // a getter is used here to prevent accidental changes
      return ComponentType.LastWriteWinElementSet as const
    },
    declaration: componentDeclaration,
    has(entity: Entity): boolean {
      return data.has(entity)
    },
    deleteFrom(entity: Entity, markAsDirty = true): T | null {
      const component = data.get(entity)
      if (data.delete(entity) && markAsDirty) {
        dirtyIterator.add(entity)
      }
      return component || null
    },
    entityDeleted(entity: Entity, markAsDirty: boolean): void {
      if (data.delete(entity) && markAsDirty) {
        dirtyIterator.add(entity)
      }
    },
    getOrNull(entity: Entity): Readonly<T> | null {
      return data.get(entity) ?? null
    },
    get(entity: Entity): Readonly<T> | undefined {
      return data.has(entity) ? data.get(entity) : undefined
    },
    create(entity: Entity, value: T): T {
      const component = data.get(entity)
      if (component) {
        throw new Error(`[create] Component ${componentDeclaration.componentId} for ${entity} already exists`)
      }
      data.set(entity, value)
      dirtyIterator.add(entity)
      return value
    },
    createOrReplace(entity: Entity, value: T): T {
      data.set(entity, value)
      dirtyIterator.add(entity)
      return value
    },
    getMutableOrNull(entity: Entity): T | null {
      const component = data.get(entity)
      if (!component) {
        return null
      }
      dirtyIterator.add(entity)
      return component
    },
    getMutable(entity: Entity): T {
      const component = this.getMutableOrNull(entity)
      if (component === null) {
        throw new Error(`[mutable] Component ${componentDeclaration.componentId} for ${entity} not found`)
      }
      return component
    },
    *iterator(): Iterable<[Entity, T]> {
      for (const [entity, component] of data) {
        yield [entity, component]
      }
    },
    dirtyIterator(): Iterable<Entity> {
      return Array.from(dirtyIterator)
    },
    dumpCrdtDeltas: createGetCrdtMessagesForLwwWithTick(componentDeclaration.componentId, updatedAtTick, timestamps, componentDeclaration, data),
    dumpCrdtUpdates: createGetCrdtMessagesForLww(componentDeclaration.componentId, updatedAtTick, timestamps, dirtyIterator, componentDeclaration, data, currentTick),
    updateFromCrdt: createUpdateLwwFromCrdt(componentDeclaration.componentId, timestamps, componentDeclaration, data),
  }
}
