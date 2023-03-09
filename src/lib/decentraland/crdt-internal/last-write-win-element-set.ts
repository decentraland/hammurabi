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
        PutComponentOperation.write(entity, timestamp, componentId, buf.toBinary(), buffer)
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

  return (msg: CrdtMessageBody): [null | PutComponentMessageBody | DeleteComponentMessageBody, any] => {
    if (msg.type !== CrdtMessageType.PUT_COMPONENT && msg.type !== CrdtMessageType.DELETE_COMPONENT)
      return [null, data.get(msg.entityId)]

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

        return [null, data.get(entity)]
      }
      case ProcessMessageResultType.StateOutdatedTimestamp:
      case ProcessMessageResultType.StateOutdatedData: {
        if (data.has(entity)) {
          const writeBuffer = new ReadWriteByteBuffer()
          schema.serialize(data.get(entity)!, writeBuffer)

          return [
            {
              type: CrdtMessageType.PUT_COMPONENT,
              componentId,
              data: writeBuffer.toBinary(),
              entityId: entity,
              timestamp: timestamps.get(entity)!
            } as PutComponentMessageBody,
            data.get(entity)
          ]
        } else {
          return [
            {
              type: CrdtMessageType.DELETE_COMPONENT,
              componentId,
              entityId: entity,
              timestamp: timestamps.get(entity)!
            } as DeleteComponentMessageBody,
            undefined
          ]
        }
      }
    }

    return [null, data.get(entity)]
  }
}

export function createGetCrdtMessagesForLww<T>(
  componentId: number,
  timestamps: Map<Entity, number>,
  dirtyIterator: Set<Entity>,
  serde: SerDe<T>,
  data: Map<Entity, T>
) {
  return function* () {
    for (const entity of dirtyIterator) {
      const newTimestamp = incrementTimestamp(entity, timestamps)
      if (data.has(entity)) {
        const writeBuffer = new ReadWriteByteBuffer()
        serde.serialize(data.get(entity)!, writeBuffer)

        const msg: PutComponentMessageBody = {
          type: CrdtMessageType.PUT_COMPONENT,
          componentId,
          entityId: entity,
          data: writeBuffer.toBinary(),
          timestamp: newTimestamp
        }

        yield msg
      } else {
        const msg: DeleteComponentMessageBody = {
          type: CrdtMessageType.DELETE_COMPONENT,
          componentId,
          entityId: entity,
          timestamp: newTimestamp
        }

        yield msg
      }
    }
    dirtyIterator.clear()
  }
}

export function createComponentDefinitionFromSchema<T>(
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
