import path from 'path'
import { nanoid } from 'nanoid'
import { RootSymbol, Store, StoreEntry } from './store'

export const generateLastModified = () => Date.now() - (Math.random() * 1e12)

export interface CommonEventdata {
  shiftKey?: boolean
  altKey?: boolean
  ctrlKey?: boolean
  metaKey?: boolean
}

export interface MouseEventData extends CommonEventdata {
  [key: string]: any
}

export function fakeMouseEvent (data: MouseEventData = {}): any {
  return {
    shiftKey: data.shiftKey || false,
    altKey: data.altKey || false,
    ctrlKey: data.ctrlKey || false,
    metaKey: data.metaKey || false
  }
}

export interface KeyboardEventData extends CommonEventdata {
  key: string
  [key: string]: any
}

export function fakeKeyboardEvent (data: KeyboardEventData): any {
  return {
    key: data.key,
    shiftKey: data.shiftKey || false,
    altKey: data.altKey || false,
    ctrlKey: data.ctrlKey || false,
    metaKey: data.metaKey || false
  }
}

export interface MockStoreEntry {
  name: string
  parent: string
  id: string
  size: number
  lastModified: number
}

export function mockStore<T> (idField = 'id', parentField = 'parent'): Store<T> {
  const store = new Store<T>({
    getId: (entry: StoreEntry<T>) => {
      return entry[idField]
    },
    getParent: (entry: StoreEntry<T>) => {
      return entry[parentField]
    }
  })
  return store
}

export function mockStoreEntry (data: any = {}): StoreEntry<MockStoreEntry> {
  const name = data.name || nanoid(8)
  const parent = data.parent || RootSymbol
  let id: string
  if (parent === RootSymbol) {
    id = `/${name}`
  } else {
    id = path.join(parent, name)
  }
  return {
    name,
    id,
    parent,
    size: Math.random() * 1e12,
    lastModified: generateLastModified(),
    ...data
  }
}

interface EventTestOpts {
  count?: number
  timeout?: number
}

export function testForEvent (obj: any, evt: string, opts: EventTestOpts = {}) {
  const { count = 1, timeout = 0 } = opts
  return new Promise((resolve, reject) => {
    let rejectTimeout: any
    let failed = true
    if (timeout) {
      rejectTimeout = setTimeout(() => {
        if (failed) {
          return reject(new Error('Timeout'))
        }
      }, timeout)
    }
    let counted = 0
    obj.on(evt, function listener (...args: any[]) {
      counted++
      if (!count || (count && counted === count)) {
        obj.off(evt, listener)
        failed = false
        rejectTimeout && clearTimeout(rejectTimeout)
        resolve(...args)
      }
    })
  })
}
