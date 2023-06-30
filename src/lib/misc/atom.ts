import { Observable } from "@babylonjs/core"
import future, { IFuture } from "fp-future"
import { useEffect, useState } from "react"

const EMPTY = Symbol('empty')
type EMPTY = typeof EMPTY

/**
 * An atom is a value that can be observed and changed. This implementation
 * is inspired by the clojure implementation of Atom.
 */
export type Atom<T> = {
  /**
   * Returns a promise that resolves with the current value of the atom. The
   * use of a promise implies this operation might be asynchronous.
   */
  deref(): Promise<T>
  /**
   * Returns the current value of the atom, or null if there's no current value.
   * This operation is synchronous, as indicated by the lack of a Promise return
   * type.
   */
  getOrNull(): T | null
  /**
   * An Atom has an Observable value that emits the current value of the atom
   * whenever it changes. This is a common pattern in reactive programming, and
   * it allows observers to react to changes in the atom's value.
   */
  observable: Observable<T>
  /**
   * Updates the current value of the atom to the provided value, and returns
   * the previous value or void (undefined) if there was no previous value.
   */
  swap(value: T): T | void
  /**
   * Takes a function that will be called with the current value of the atom,
   * and returns a promise that resolves when this operation is complete. This
   * could be used to perform side effects or transformations based on the
   * atom's value.
   */
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