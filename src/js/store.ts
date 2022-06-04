import { markRaw, reactive } from 'vue'
import Emittery from 'emittery'

type Ancestor = string | null

export const RootSymbol = Symbol.for('root').toString()

export type StoreEntry<T = any> = T & {
  [id: string | symbol]: any
}
// export interface StoreEntry<T = any> {
//   [id: string | symbol]: any
// }

export interface EntryMap<T = any> {
  [id: string]: StoreEntry<T>
}

export interface ChildrenMap<T = any> {
  [id: string]: EntryMap<T>
}

export interface DepthEntry<T = any> {
  id: string
  depth: Number
  entry: StoreEntry<T>
}

export interface DepthEntryMap<T = any> {
  [id: string]: DepthEntry<T>
}

interface ExpandedMap {
  [key: string]: Boolean
}

interface StoreInterface<T = any> {
  getId(entry: StoreEntry<T>): string
  getParent(entry: StoreEntry<T>): Ancestor
}

export interface SortFunction<T = any> {
  (a: StoreEntry<T>, b: StoreEntry<T>): number
}

type StoreEvents = {
  update: undefined
}

export class Store<T = any> {
  entryMap: EntryMap<T>
  interface: StoreInterface<T>
  expanded: ExpandedMap
  children: ChildrenMap<T>
  emitter: Emittery<StoreEvents>
  constructor (iface: StoreInterface<T>) {
    this.interface = iface
    this.entryMap = reactive({})
    this.expanded = reactive({
      [RootSymbol]: true
    })
    this.children = reactive({})
    this.emitter = markRaw(new Emittery<StoreEvents>())
  }

  on<Name extends keyof StoreEvents> (evt: Name | Name[], listener: (eventData: StoreEvents[Name]) => void | Promise<void>): Emittery.UnsubscribeFn {
    return this.emitter.on(evt, listener)
  }

  off<Name extends keyof StoreEvents> (evt: Name | Name[], listener: (eventData: StoreEvents[Name]) => void | Promise<void>) {
    return this.emitter.on(evt, listener)
  }

  emit<Name extends keyof StoreEvents> (evt: Name, data?: StoreEvents[Name]): Promise<void> {
    return this.emitter.emit(evt, data)
  }

  getEntries (ancestor: Ancestor, sort: SortFunction = () => 1, depth?: number, result?: DepthEntryMap<T>) {
    if (!result) {
      result = {}
    }
    if (!depth) {
      depth = 0
    }
    const ancestorId = ancestor || RootSymbol

    if (depth !== 0 && !this.expanded[ancestorId]) {
      // This entry is not expanded. Skip processing its children
      return result
    }
    // Iterate over the direct children
    const childrenEntryMap = this.children[ancestorId]
    if (!childrenEntryMap) {
      return result
    }
    const entries = Object.entries(childrenEntryMap)
    const sortedEntries = entries.sort((a, b) => sort(a[1], b[1]))
    for (const [id, entry] of sortedEntries) {
      result[id] = { id, depth, entry }
      this.getEntries(id, sort, depth + 1, result)
    }
    return result
  }

  addEntry (entry: StoreEntry<T>, emitUpdate = true) {
    const id = this.getId(entry)
    this.entryMap[id] = entry
    const parentId = this.getParent(entry)

    if (!this.children[parentId]) {
      this.children[parentId] = {}
    }
    this.children[parentId][id] = entry
    if (emitUpdate) {
      this.emitter.emit('update')
    }
  }

  addEntries (entries: StoreEntry<T>[]) {
    entries.forEach(entry => this.addEntry(entry, false))
    this.emitter.emit('update')
  }

  removeEntry (entry: StoreEntry<T>) {
    const id = this.getId(entry)
    delete this.entryMap[id]
    delete this.expanded[id]

    const parentId = this.getParent(entry)

    if (this.children[parentId]) {
      delete this.children[parentId][id]
      let isEmpty = true
      // eslint-disable-next-line no-unreachable-loop
      for (const _ in this.children[parentId]) {
        isEmpty = false
        break
      }
      if (isEmpty) {
        // Parent is empty. So remove it's expanded
        delete this.children[parentId]
        delete this.expanded[parentId]
      }
    }
    this.emitter.emit('update')
  }

  updateExpanded (id: string, val: boolean) {
    const old = !!this.expanded[id]
    let modified = false
    if (!val || this.hasChildren(id)) {
      this.expanded[id] = val
    }
    const expandedSet = new Set(Object.keys(this.expanded))
    if (!val) {
      // This folder was just collapsed. We need to collapse all of its descendants
      const recursiveCollapse = (id: string) => {
        if (!this.hasChildren(id)) {
          return
        }
        const expandedChildIds = Object.keys(this.children).filter(childId => expandedSet.has(childId))
        for (const childId of expandedChildIds) {
          if (this.expanded[childId]) {
            modified = true
            this.expanded[childId] = false
            recursiveCollapse(childId)
          }
        }
      }
      recursiveCollapse(id)
    }
    if (old !== !!this.expanded[id] || modified) {
      this.emitter.emit('update')
    }
  }

  getId (entry: StoreEntry<T>) {
    return this.interface.getId(entry)
  }

  getParent (entry: StoreEntry<T>) {
    return this.interface.getParent(entry) || RootSymbol
  }

  hasChildren (entry: StoreEntry<T> | string | Symbol): boolean {
    let id: string
    if (typeof entry === 'object') {
      id = this.getId(entry as StoreEntry<T>)
    } else {
      id = entry as string
    }
    if (!this.children[id]) {
      return false
    }
    return Object.keys(this.children[id]).length !== 0
  }
}
