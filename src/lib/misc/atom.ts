// atom value wrapper like in clojure

import { Observable } from "@babylonjs/core"
import future, { IFuture } from "fp-future"
// No React needed for headless server

const EMPTY = Symbol('empty')
type EMPTY = typeof EMPTY

export type Atom<T> = {
  deref(): Promise<T>
  getOrNull(): T | null
  observable: Observable<T>
  swap(value: T): T | void
  pipe(fn: (value: T) => void | Promise<void>): Promise<void>
}

export function Atom<T>(initialValue: T | EMPTY = EMPTY): Atom<T> {
  const observable = new Observable<T>()
  let value: T | EMPTY = initialValue
  const valueFutures: IFuture<T>[] = []

  observable.addOnce(value => {
    valueFutures.forEach($ => $.resolve(value))
    valueFutures.length = 0
  })

  return {
    async pipe(fn) {
      observable.add(async (t) => {
        try {
          await fn(t)
        } catch (err) {
          console.error(err)
        }
      })
      if (value !== EMPTY) {
        try {
          await fn(value)
        } catch (err) {
          console.error(err)
        }
      }
    },
    deref() {
      if (value === EMPTY) {
        const ret = future<T>()
        valueFutures.push(ret)
        return ret
      }
      return Promise.resolve(value)
    },
    getOrNull() {
      if (value === EMPTY) {
        return null
      }
      return value
    },
    observable,
    swap(newValue) {
      const oldValue = value
      if (newValue !== value) {
        value = newValue
        observable.notifyObservers(value)
      }
      return oldValue == EMPTY ? undefined : oldValue
    }
  }
}

// useAtom hook removed - not needed for headless server