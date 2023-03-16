import { ByteBuffer, ReadWriteByteBuffer } from "../ByteBuffer"
import { PutComponentOperation, DeleteComponent, PutComponentMessageBody, DeleteComponentMessageBody, CrdtMessageType, CrdtMessageBody } from "../crdt-wire-protocol"
import { Entity } from "../types"
import { ComponentType, LastWriteWinElementSetComponentDefinition, SerDe } from "./components"
import { ProcessMessageResultType } from "./conflict-resolution"
import { dataCompare } from "./dataCompare"

export function incrementTimestamp(entity: Entity, timestamps: Map<Entity, number>): number {
  const newTimestamp = (timestamps.get(entity) || 0) + 1
  timestamps.set(entity, newTimestamp)
  return newTimestamp
}

/**
 * This function dumps the whole state of the component into a write buffer.
 */
export function createLwwDumpFunctionFromCrdt<T>(
  componentId: number,
  timestamps: Map<Entity, number>,
  schema: SerDe<T>,
  data: Map<Entity, T>
) {
  return function dumpCrdtState(buffer: ByteBuffer) {
    for (const [entity, timestamp] of timestamps) {
      if (data.has(entity)) {
        const it = data.get(entity)!
        const buf = new ReadWriteByteBuffer() // TODO: performance-wise, this buffer could be wiped and reused to reduce allocations
        schema.serialize(it, buf)
        PutComponentOperation.write(entity, componentId, timestamp, buf.toBinary(), buffer)
      } else {
        DeleteComponent.write(entity, componentId, timestamp, buffer)
      }
    }
  }
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
      // console.log('2', currentTimestamp, timestamp)
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
    const entity = msg.entityId as Entity
    switch (action) {
      case ProcessMessageResultType.StateUpdatedData:
      case ProcessMessageResultType.StateUpdatedTimestamp: {
        timestamps.set(entity, msg.timestamp)

        if (msg.type === CrdtMessageType.PUT_COMPONENT) {
          const buf = new ReadWriteByteBuffer(msg.data!)
          data.set(entity, schema.deserialize(buf))
        } else {
          data.delete(entity)
        }

        return true // change accepted
      }
      case ProcessMessageResultType.StateOutdatedTimestamp:
      case ProcessMessageResultType.StateOutdatedData: {
        if (data.has(entity)) {
          const writeBuffer = new ReadWriteByteBuffer()
          schema.serialize(data.get(entity)!, writeBuffer)

          // post conflict resolution update
          PutComponentOperation.write(entity, componentId, timestamps.get(entity)!, writeBuffer.toBinary(), conflictResolutionByteBuffer)

          return false // change not accepted
        } else {
          // post conflict resolution update
          DeleteComponent.write(entity, componentId, timestamps.get(entity)!, conflictResolutionByteBuffer)

          return false // change not accepted
        }
      }
    }

    return true // change accepted
  }
}

export function createGetCrdtMessagesForLww<T>(
  componentId: number,
  timestamps: Map<Entity, number>,
  dirtyIterator: Set<Entity>,
  serde: SerDe<T>,
  data: Map<Entity, T>
) {
  return function (outBuffer: ByteBuffer) {
    for (const entity of dirtyIterator) {
      const newTimestamp = incrementTimestamp(entity, timestamps)
      if (data.has(entity)) {
        const writeBuffer = new ReadWriteByteBuffer()
        serde.serialize(data.get(entity)!, writeBuffer)

        PutComponentOperation.write(
          entity,
          componentId,
          newTimestamp,
          writeBuffer.toBinary(),
          outBuffer
        )
      } else {
        DeleteComponent.write(
          entity,
          componentId,
          newTimestamp,
          outBuffer
        )
      }
    }
    dirtyIterator.clear()
  }
}

export function createLwwStoreFromSerde<T>(
  componentId: number,
  serde: SerDe<T>
): LastWriteWinElementSetComponentDefinition<T> {
  const data = new Map<Entity, T>()
  const dirtyIterator = new Set<Entity>()
  const timestamps = new Map<Entity, number>()

  return {
    get componentId() {
      return componentId
    },
    get componentType() {
      // a getter is used here to prevent accidental changes
      return ComponentType.LastWriteWinElementSet as const
    },
    serde,
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
    get(entity: Entity): Readonly<T> {
      const component = data.get(entity)
      if (!component) {
        throw new Error(`[getFrom] Component ${componentId} for entity #${entity} not found`)
      }
      return component
    },
    create(entity: Entity, value: T): T {
      const component = data.get(entity)
      if (component) {
        throw new Error(`[create] Component ${componentId} for ${entity} already exists`)
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
        throw new Error(`[mutable] Component ${componentId} for ${entity} not found`)
      }
      return component
    },
    *iterator(): Iterable<[Entity, T]> {
      for (const [entity, component] of data) {
        yield [entity, component]
      }
    },
    *dirtyIterator(): Iterable<Entity> {
      for (const entity of dirtyIterator) {
        yield entity
      }
    },
    getCrdtUpdates: createGetCrdtMessagesForLww(componentId, timestamps, dirtyIterator, serde, data),
    updateFromCrdt: createUpdateLwwFromCrdt(componentId, timestamps, serde, data),
    dumpCrdtState: createLwwDumpFunctionFromCrdt(componentId, timestamps, serde, data)
  }
}
