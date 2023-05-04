// atom value wrapper like in clojure

import { Observable } from "@babylonjs/core"
import future, { IFuture } from "fp-future"

const EMPTY = Symbol('empty')
type EMPTY = typeof EMPTY

export type Atom<T> = {
  deref(): Promise<T>
  getOrNull(): T | null
  observable: Observable<T>
  swap(value: T): T | void
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
      value = newValue
      observable.notifyObservers(value)
      return oldValue == EMPTY ? undefined : oldValue
    }
  }
}