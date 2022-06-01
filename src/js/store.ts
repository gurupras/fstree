type Ancestor = string | null

export const RootSymbol = Symbol.for('root')

export type StoreEntry<T = any> = T & {
  [id: string | symbol]: any
}
// export interface StoreEntry<T = any> {
//   [id: string | symbol]: any
// }

export interface EntryMap<T = any> {
  [id: string | symbol]: StoreEntry<T>
}

export interface ChildrenMap<T = any> {
  [id: string | symbol]: EntryMap<T>
}

export interface DepthEntry<T = any> {
  id: string | symbol
  depth: Number
  entry: StoreEntry<T>
}

export interface DepthEntryMap<T = any> {
  [id: string | symbol]: DepthEntry<T>
}

interface ExpandedMap {
  [key: string | symbol]: Boolean
}

interface StoreInterface<T = any> {
  getId(entry: StoreEntry<T>): string
  getParent(entry: StoreEntry<T>): Ancestor
}

export interface SortFunction<T = any> {
  (a: StoreEntry<T>, b: StoreEntry<T>): number
}

export class Store<T = any> {
  data: StoreEntry<T>[]
  entryMap: EntryMap<T>
  interface: StoreInterface<T>
  expanded: ExpandedMap
  children: ChildrenMap<T>

  constructor (iface: StoreInterface<T>) {
    this.interface = iface
    this.data = [] as StoreEntry<T>[]
    this.entryMap = {} as EntryMap<T>
    this.expanded = {
      [RootSymbol]: true
    }
    this.children = {} as ChildrenMap<T>
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

  addEntry (entry: StoreEntry<T>) {
    this.data.push(entry)
    const id = this.getId(entry)
    this.entryMap[id] = entry
    const parent = this.getParent(entry)

    const parentId = parent || RootSymbol
    if (!this.children[parentId]) {
      this.children[parentId] = {}
    }
    this.children[parentId][id] = entry
  }

  addEntries (entries: StoreEntry<T>[]) {
    entries.forEach(this.addEntry, this)
  }

  updateExpanded (id: string, val: boolean) {
    if (!val || this.hasChildren(id)) {
      this.expanded[id] = val
    }
    if (!val) {
      // This folder was just collapsed. We need to collapse all of its descendants
      for (const expandedId of Object.keys(this.expanded)) {
        if (expandedId.startsWith(id)) {
          // This is a descendant. Mark is as collapsed
          this.expanded[expandedId] = false
        }
      }
    }
  }

  getId (entry: StoreEntry<T>) {
    return this.interface.getId(entry)
  }

  getParent (entry: StoreEntry<T>) {
    return this.interface.getParent(entry)
  }

  hasChildren (entry: StoreEntry<T> | string | Symbol): boolean {
    let id: string | symbol
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
