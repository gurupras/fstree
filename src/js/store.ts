type Ancestor = string | null

export const RootSymbol = Symbol.for('root')

interface HasChildrenMap {
  [id: string | symbol]: boolean
}

export interface StoreEntry {
  [id: string | symbol]: any
}

export interface EntryMap {
  [id: string | symbol]: StoreEntry
}

export interface ChildrenMap {
  [id: string | symbol]: EntryMap
}

interface DepthEntry {
  depth: Number
  entry: StoreEntry
}

interface DepthEntryMap {
  [id: string | symbol]: DepthEntry
}

interface ExpandedMap {
  [key: string | symbol]: Boolean
}

interface StoreInterface {
  getId(entry: StoreEntry): string
  getParent(entry: StoreEntry): Ancestor
  getName(entry: StoreEntry): string
}

export class Store {
  data: StoreEntry[]
  hasChildren: HasChildrenMap
  entryMap: EntryMap
  interface: StoreInterface
  expanded: ExpandedMap
  children: ChildrenMap

  constructor (iface: StoreInterface) {
    this.interface = iface
    this.data = []
    this.hasChildren = {}
    this.entryMap = {}
    this.expanded = {}
    this.children = {}
  }

  _isDescendant (entry: StoreEntry, ancestor: Ancestor): boolean {
    const parent = this.getParent(entry)
    if (parent && parent === ancestor) {
      return true
    } else if (parent && parent !== ancestor) {
      // Get the store entry for this parent
      const parentEntry = this.entryMap[parent]
      if (!parentEntry) {
        return false
      }
      return this._isDescendant(parentEntry, ancestor)
    }
    return false
  }

  getEntries (ancestor: Ancestor, depth?: number, result?: DepthEntryMap) {
    if (!result) {
      result = {}
    }
    if (!depth) {
      depth = 0
    }
    const ancestorId = ancestor || RootSymbol

    if (!this.expanded[ancestorId]) {
      // This entry is not expanded. Skip processing its children
      return
    }
    // Iterate over the direct children
    const childrenEntryMap = this.children[ancestorId]
    if (!childrenEntryMap) {
      return
    }
    for (const [id, entry] of Object.entries(childrenEntryMap)) {
      result[id] = { depth, entry }
      this.getEntries(id, depth + 1, result)
    }
    return result
  }

  addEntry (entry: StoreEntry) {
    this.data.push(entry)
    const id = this.getId(entry)
    this.entryMap[id] = entry
    const parent = this.getParent(entry)
    const parentEntry = this.entryMap[parent!]
    if (parentEntry) {
      this.hasChildren[this.getId(parentEntry)] = true
    }

    const parentId = parent || RootSymbol
    if (!this.children[parentId]) {
      this.children[parentId] = {}
    }
    this.children[parentId][id] = entry
  }

  addEntries (entries: StoreEntry[]) {
    entries.forEach(this.addEntry, this)
  }

  updateExpanded (id: string, val: boolean) {
    this.expanded[id] = val
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

  getId (entry: StoreEntry) {
    return this.interface.getId(entry)
  }

  getParent (entry: StoreEntry) {
    return this.interface.getParent(entry)
  }

  getName (entry: StoreEntry) {
    return this.interface.getName(entry)
  }
}
