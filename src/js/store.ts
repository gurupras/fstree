import { markRaw, reactive } from 'vue'
import Emittery from 'emittery'

type Ancestor = string | null

export const RootSymbol = Symbol.for('root').toString()
export const UpOneLevelSymbol = Symbol.for('parent-entry').toString()

export type StoreEntry<T = any> = T & {
  [id: string | symbol]: any
}
// export interface StoreEntry<T = any> {
//   [id: string | symbol]: any
// }

export type EntryMap<T = any> = Map<string, StoreEntry<T>>

export type ChildrenMap<T = any> = Map<string, EntryMap<T>>

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
  hasChildren?(entry: StoreEntry<T>): boolean
  getUpOneLevelEntry?(entry: StoreEntry<T>): StoreEntry<T>
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
    this.entryMap = reactive(new Map())
    this.expanded = reactive({
      [RootSymbol]: true
    })
    this.children = reactive(new Map())
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
    const childrenEntryMap = this.children.get(ancestorId)
    if (!childrenEntryMap) {
      return result
    }

    const entries: [string, StoreEntry<T>][] = []
    for (const entry of childrenEntryMap.entries()) {
      entries.push(entry)
    }
    const sortedEntries = entries.sort((a, b) => sort(a[1], b[1]))
    for (const [id, entry] of sortedEntries) {
      result[id] = { id, depth, entry }
      this.getEntries(id, sort, depth + 1, result)
    }
    return result
  }

  addEntry (entry: StoreEntry<T>, emitUpdate = true) {
    const id = this.getId(entry)
    this.entryMap.set(id, entry)
    const parentId = this.getParent(entry)

    if (!this.children.has(parentId)) {
      this.children.set(parentId, new Map())
    }
    this.children.get(parentId)!.set(id, entry)
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
    this.entryMap.delete(id)
    delete this.expanded[id]

    const parentId = this.getParent(entry)

    if (this.children.has(parentId)) {
      const parentMap = this.children.get(parentId)!
      parentMap.delete(id)
      if (parentMap.size === 0) {
        // Parent is empty. So remove it's expanded
        this.children.delete(parentId)
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

        const expandedChildIds: string[] = []
        for (const childId of this.children.get(id)!.keys()) {
          if (expandedSet.has(childId)) {
            expandedChildIds.push(childId)
          }
        }

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

  getUpOneLevelEntry (entry: StoreEntry<T>): StoreEntry<T> {
    if (!this.interface.getUpOneLevelEntry) {
      throw new Error('Provided interface does not implement getUpOneLevelEntry()')
    }
    const parentEntry: StoreEntry = this.interface.getUpOneLevelEntry(entry)
    if (parentEntry) {
      parentEntry[UpOneLevelSymbol] = true
    }
    return parentEntry
  }

  isUpOneLevelEntry (entry: StoreEntry<T>): boolean {
    if (entry[UpOneLevelSymbol]) {
      return true
    }
    return false
  }

  hasChildren (entry: StoreEntry<T> | string): boolean {
    if (entry === RootSymbol) {
      return true
    }
    if (this.interface.hasChildren) {
      if (typeof entry === 'string') {
        entry = this.entryMap.get(entry)!
      }
      return this.interface.hasChildren(entry)
    } else {
      let id: string
      if (typeof entry === 'object') {
        id = this.getId(entry as StoreEntry<T>)
      } else {
        id = entry as string
      }
      if (!this.children.has(id)) {
        return false
      }
      return this.children.get(id)!.size > 0
    }
  }
}
