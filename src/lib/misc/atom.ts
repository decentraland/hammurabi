// atom value wrapper like in clojure

import { Observable } from "@babylonjs/core"
import future, { IFuture } from "fp-future"
import { useEffect, useState } from "react"

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
      if (newValue !== value) {
        value = newValue
        observable.notifyObservers(value)
      }
      return oldValue == EMPTY ? undefined : oldValue
    }
  }
}

export function useAtom<T>(atom: Atom<T>): T | null {
  const [value, setValue] = useState(atom.getOrNull())

  useEffect(() => {
    function obs() {
      setValue(atom.getOrNull())
    }
    const observer = atom.observable.add(obs)
    return (): void => { atom.observable.remove(observer) }
  }, [atom])

  return value
}