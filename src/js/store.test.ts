import { beforeEach, describe, expect, test } from 'vitest'
import { DepthEntryMap, RootSymbol, Store, StoreEntry } from './store'
import { nanoid } from 'nanoid'
import { generateLastModified } from './test-utils'
import path from 'path'

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

describe('Store', () => {
  let store: Store

  const root: MockStoreEntry = mockStoreEntry({
    name: '/',
    id: '/',
    parent: null,
    size: 0
  })

  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
  })

  test('getId', () => {
    expect(store.getId(root)).toEqual(root.id)
  })

  test('getParent', () => {
    const entry = mockStoreEntry({ parent: '/home/user/workspace' })
    expect(store.getParent(root)).toEqual(root.parent)
    expect(store.getParent(entry)).toEqual(entry.parent)
  })

  describe('addEntry', () => {
    test('Adds it to the store', async () => {
      const entry = mockStoreEntry()
      expect(() => store.addEntry(entry)).not.toThrow()
      expect(store.data.length).toEqual(1)
    })
    test('Updates entryMap', async () => {
      const entry1 = mockStoreEntry()
      const entry2 = mockStoreEntry()
      store.addEntry(entry1)
      store.addEntry(entry2)
      expect(store.entryMap[entry1.id]).toEqual(entry1)
      expect(store.entryMap[entry2.id]).toEqual(entry2)
    })
    test('Updates children map', async () => {
      store.addEntry(root)
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      expect(store.children[root.id]).toMatchObject({
        [child.id]: child
      })
    })
    test('Parent of null makes it child of root entry', async () => {
      store.addEntry(root)
      expect(store.children[RootSymbol]).toMatchObject({
        [root.id]: root
      })
    })
    test('Without parent still update children map', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      expect(store.children[root.id]).toMatchObject({
        [child.id]: child
      })
    })
    test('Child first and then parent does not clear out children map', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      store.addEntry(root)
      expect(store.children[root.id]).toMatchObject({
        [child.id]: child
      })
    })
  })

  describe('removeEntry', () => {
    let child: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      child = mockStoreEntry()
      store.addEntries([root, child])
    })

    test.todo('Updates entryMap')
    test.todo('Updates children map')
    test.todo('Resets expanded if entry no longer has any children')
  })

  describe.todo('Should changes to parent/id update maps?')

  describe('hasChildren', () => {
    let child: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      child = mockStoreEntry({ parent: root.id })
    })
    test.each([
      ['StoreEntry', () => root, true],
      ['String', () => root.id, true]
    ])('Works with %s', async (_, getter, expected) => {
      store.addEntries([root, child])
      const val = getter()
      expect(store.hasChildren(val)).toEqual(expected)
    })
    test('Returns false for unknown entries', async () => {
      expect(store.hasChildren(child)).toBe(false)
    })
    test('Returns false for entries that have no children', async () => {
      store.addEntry(root)
      expect(store.hasChildren(root)).toBe(false)
    })
    test('Returns true for entries that have children', async () => {
      store.addEntry(root)
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      expect(store.hasChildren(root)).toBe(true)
    })
  })

  describe('updateExpanded', () => {
    test.each([
      [true],
      [false]
    ])('Works with %s when entry has children', async val => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      store.updateExpanded(root.id, val)
      expect(store.expanded[root.id]).toBe(val)
    })

    test('Does not update expanded map if entry has no children', async () => {
      store.updateExpanded(root.id, true)
      expect(store.expanded[root.id]).toBeFalsy()
    })

    test('Collapsing ancestor collapses all expanded children', async () => {
      const dir1 = mockStoreEntry({ name: 'dir1', parent: null })
      const subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
      const subdir2 = mockStoreEntry({ name: 'subdir2', parent: subdir1.id })
      const subdir2Children: StoreEntry<MockStoreEntry>[] = [...Array(3)].map(x => mockStoreEntry({ parent: subdir2.id }))
      store.addEntries([dir1, subdir1, subdir2, ...subdir2Children])
      store.expanded[dir1.id] = true
      store.expanded[subdir1.id] = true
      store.expanded[subdir2.id] = true

      store.updateExpanded(subdir1.id, false)
      expect(store.expanded[subdir2.id]).toBeFalsy()

      store.updateExpanded(root.id, false)
      expect(store.expanded[subdir1.id]).toBeFalsy()
    })
  })

  describe('getEntries', () => {
    let dir1: StoreEntry<MockStoreEntry>
    let dir1Children: StoreEntry<MockStoreEntry>[]
    let subdir1: StoreEntry<MockStoreEntry>
    let subdir1Children: StoreEntry<MockStoreEntry>[]
    let subdir2: StoreEntry<MockStoreEntry>
    let subdir2Children: StoreEntry<MockStoreEntry>[]
    beforeEach(() => {
      dir1 = mockStoreEntry({ name: 'dir1', parent: root.id })
      dir1Children = [...Array(10)].map(x => mockStoreEntry({ parent: dir1.id }))
      subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
      subdir1Children = [...Array(10)].map(x => mockStoreEntry({ parent: subdir1.id }))
      subdir2 = mockStoreEntry({ name: 'subdir2', parent: dir1.id })
      subdir2Children = [...Array(10)].map(x => mockStoreEntry({ parent: subdir2.id }))
    })
    test('Does not throw when invoked with null', async () => {
      expect(() => store.getEntries(null)).not.toThrow()
    })
    test('Returns root elements when invoked with null', async () => {
      store.addEntry(root)
      const siblingRoot = mockStoreEntry({ parent: root.parent })
      store.addEntry(siblingRoot)
      const expected = {
        [root.id]: { id: root.id, depth: 0, entry: root },
        [siblingRoot.id]: { id: siblingRoot.id, depth: 0, entry: siblingRoot }
      }
      const got = store.getEntries(null)
      expect(got).toEqual(expected)
    })
    test('Only returns children of expanded entries', async () => {
      store.addEntries([dir1, ...dir1Children, subdir1, ...subdir1Children, subdir2, ...subdir2Children])
      // Expand subdir1 but leave subdir2 collapsed
      store.expanded[dir1.id] = true
      store.expanded[subdir1.id] = true
      const got = store.getEntries(dir1.id)
      const expected = {} as Record<string, any>
      dir1Children.forEach(entry => { expected[entry.id] = { id: entry.id, entry } })
      expected[subdir1.id] = { id: subdir1.id, entry: subdir1 }
      subdir1Children.forEach(entry => { expected[entry.id] = { id: entry.id, entry } })
      expected[subdir2.id] = { id: subdir2.id, entry: subdir1 }
      expect(Object.keys(got).sort()).toEqual(Object.keys(expected).sort())
    })
    test('Only returns entries relative to ancestor', async () => {
      store.addEntries([dir1, ...dir1Children, subdir1, ...subdir1Children, subdir2, ...subdir2Children])
      const subdir3 = mockStoreEntry({ name: 'subdir-3', parent: subdir2.id })
      const subdir3Children = [mockStoreEntry({ parent: subdir3.id })]
      store.addEntries([subdir3, ...subdir3Children])
      store.expanded[subdir3.id] = true
      const got = store.getEntries(subdir2.id, () => 1)
      const expected: DepthEntryMap = {}
      for (const child of subdir2Children) {
        expected[child.id] = { id: child.id, depth: 0, entry: child }
      }
      expected[subdir3.id] = { id: subdir3.id, depth: 0, entry: subdir3 }
      for (const child of subdir3Children) {
        expected[child.id] = { id: child.id, depth: 1, entry: child }
      }
      expect(got).toEqual(expected)
    })
  })
})
