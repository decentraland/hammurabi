import { ReadWriteByteBuffer, ByteBuffer } from "../ByteBuffer";
import { AppendValueMessageBody, CrdtMessageType, AppendValueOperation } from "../crdt-wire-protocol";
import { Entity } from "../types";
import { ComponentDeclaration, ComponentType, GrowOnlyValueSetComponentDefinition } from "./components";

function frozenError() {
  throw new Error('The set is frozen')
}

function freezeSet<T>(set: Set<T>): ReadonlySet<T> {
  ;(set as any).add = frozenError
  ;(set as any).clear = frozenError

  return set as ReadonlySet<T>
}

const emptyReadonlySet = freezeSet(new Set())

function sortByTimestamp(a: { timestamp: number }, b: { timestamp: number }) {
  return a.timestamp > b.timestamp ? 1 : -1
}

/**
 * @public
 */
export type ValueSetOptions<T> = {
  // function that returns a timestamp from the value
  timestampFunction: (value: Readonly<T>) => number
  // max elements to store in memory, ordered by timestamp
  maxElements: number
}

export function createValueSetComponentStore<T, ComponentNumber extends number>(
  declaration: ComponentDeclaration<T, ComponentNumber>,
  options: ValueSetOptions<T>
): GrowOnlyValueSetComponentDefinition<T> {
  type InternalDatastructure = {
    raw: Array<{ value: Readonly<T>; timestamp: number }>
    frozenSet: ReadonlySet<T>
  }
  const data = new Map<Entity, InternalDatastructure>()
  const dirtyIterator = new Set<Entity>()
  const queuedCommands: AppendValueMessageBody[] = []

  // only sort the array if the latest (N) element has a timestamp <= N-1
  function shouldSort(row: InternalDatastructure) {
    const len = row.raw.length
    if (len > 1 && row.raw[len - 1].timestamp <= row.raw[len - 2].timestamp) {
      return true
    }
    return false
  }

  function gotUpdated(entity: Entity): ReadonlySet<T> {
    const row = data.get(entity)
    if (row) {
      if (shouldSort(row)) {
        row.raw.sort(sortByTimestamp)
      }
      while (row.raw.length > options.maxElements) {
        row.raw.shift()
      }
      const frozenSet: ReadonlySet<T> = freezeSet(new Set(row?.raw.map(($) => Object.freeze($.value))))
      row.frozenSet = frozenSet
      return frozenSet
    } else {
      /* istanbul ignore next */
      return emptyReadonlySet as any
    }
  }

  function append(entity: Entity, value: Readonly<T>) {
    let row = data.get(entity)
    if (!row) {
      row = { raw: [], frozenSet: emptyReadonlySet as any }
      data.set(entity, row)
    }
    const timestamp = options.timestampFunction(value as any)
    // this is an expensive operation, but this explorer should prioritize correctness over performance
    Object.freeze(value)
    row.raw.push({ value, timestamp })
    return { set: gotUpdated(entity), value }
  }

  const ret: GrowOnlyValueSetComponentDefinition<T> = {
    get componentId() {
      return declaration.componentId
    },
    get componentType() {
      // a getter is used here to prevent accidental changes
      return ComponentType.GrowOnlyValueSet as const
    },
    declaration,
    has(entity: Entity): boolean {
      return data.has(entity)
    },
    entityDeleted(entity: Entity): void {
      data.delete(entity)
    },
    get(entity: Entity): ReadonlySet<T> {
      const values = data.get(entity)
      if (values) {
        return values.frozenSet
      } else {
        return emptyReadonlySet as any
      }
    },
    addValue(entity: Entity, rawValue: Readonly<T>) {
      const { set, value } = append(entity, rawValue)
      dirtyIterator.add(entity)
      const buf = new ReadWriteByteBuffer()
      declaration.serialize(value, buf)
      queuedCommands.push({
        componentId: declaration.componentId,
        data: buf.toBinary(),
        entityId: entity,
        timestamp: 0,
        type: CrdtMessageType.APPEND_VALUE
      })
      return set
    },
    *iterator(): Iterable<[Entity, Iterable<Readonly<T>>]> {
      for (const [entity, component] of data) {
        yield [entity, component.frozenSet]
      }
    },
    dirtyIterator(): Iterable<Entity> {
      return Array.from(dirtyIterator)
    },
    dumpCrdtUpdates(outBuffer: ByteBuffer) {
      dirtyIterator.clear()
      for (const command of queuedCommands) {
        AppendValueOperation.write(command, outBuffer)
      }
      queuedCommands.length = 0
    },
    dumpCrdtDeltas(outBuffer, fromTimestamp) {
      // not implemented for GOVS component
      return 0
    },
    updateFromCrdt(body, _conflictResolutionByteBuffer: ByteBuffer) {
      if (body.type === CrdtMessageType.APPEND_VALUE) {
        const buf = new ReadWriteByteBuffer(body.data)
        append(body.entityId, declaration.deserialize(buf) as Readonly<T>)
      }
      return true
    }
  }

  return ret
}
