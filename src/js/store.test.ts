import { beforeEach, describe, expect, test, vitest } from 'vitest'
import { DepthEntryMap, RootSymbol, Store, StoreEntry } from './store'
import { mockStore, mockStoreEntry, MockStoreEntry, testForEvent, toObject } from './test-utils'

describe('Store', () => {
  let root: StoreEntry<MockStoreEntry>
  let store: Store

  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
    root = mockStoreEntry({
      name: '/',
      id: '/',
      parent: null,
      size: 0
    })
  })

  test('getId', () => {
    expect(store.getId(root)).toEqual(root.id)
  })

  test('getParent', () => {
    const entry = mockStoreEntry({ parent: '/home/user/workspace' })
    expect(store.getParent(entry)).toEqual(entry.parent)
  })

  test('getParent returns RootSymbol if parent is null', async () => {
    expect(store.getParent(root)).toEqual(RootSymbol)
  })

  test('getUpOneLevelEntry throws error if interface does not implement it', async () => {
    const dir1 = mockStoreEntry({ name: 'dir1', parent: root.id })
    store.entryMap.set(dir1.id, dir1)
    const m: Map<string, StoreEntry<MockStoreEntry>> = new Map()
    m.set(dir1.id, dir1)
    store.children.set(root.id, m)
    expect(() => store.getUpOneLevelEntry(dir1)).toThrow()
  })

  test('getUpOneLevelEntry calls interface method when provided', async () => {
    store.interface.getUpOneLevelEntry = vitest.fn()
    expect(() => store.getUpOneLevelEntry(root)).not.toThrow()
  })

  test('Able to emit events', async () => {
    const promise = testForEvent(store, 'update')
    expect(() => store.emit('update')).not.toThrow()
    await expect(promise).resolves.toBeUndefined()
  })

  describe('addEntry', () => {
    test('Adds it to the store', async () => {
      const entry = mockStoreEntry()
      expect(() => store.addEntry(entry)).not.toThrow()
      expect(store.entryMap.size).toEqual(1)
    })
    test('Updates entryMap', async () => {
      const entry1 = mockStoreEntry()
      const entry2 = mockStoreEntry()
      store.addEntry(entry1)
      store.addEntry(entry2)
      expect(store.entryMap.get(entry1.id)).toEqual(entry1)
      expect(store.entryMap.get(entry2.id)).toEqual(entry2)
    })
    test('Updates children map', async () => {
      store.addEntry(root)
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      expect(toObject(store.children.get(root.id)!)).toMatchObject({
        [child.id]: child
      })
    })
    test('Parent of null makes it child of root entry', async () => {
      store.addEntry(root)
      expect(toObject(store.children.get(RootSymbol)!)).toMatchObject({
        [root.id]: root
      })
    })
    test('Without parent still update children map', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      expect(toObject(store.children.get(root.id)!)).toMatchObject({
        [child.id]: child
      })
    })
    test('Child first and then parent does not clear out children map', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      store.addEntry(root)
      expect(toObject(store.children.get(root.id)!)).toMatchObject({
        [child.id]: child
      })
    })
    test('Emits \'update\' event', async () => {
      const promise = testForEvent(store, 'update')
      const child = mockStoreEntry({ parent: root.id })
      store.addEntry(child)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('removeEntry', () => {
    let child: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      child = mockStoreEntry({ parent: root.id })
      store.addEntries([root, child])
    })

    test('Removes entry from entryMap', async () => {
      store.removeEntry(child)
      expect([...store.entryMap.keys()]).toEqual([root.id])
    })

    test('Removes entry from children map', async () => {
      const child1 = mockStoreEntry({ parent: root.id })
      store.addEntry(child1)
      store.removeEntry(child)
      expect([...store.children.keys()]).toEqual([RootSymbol, root.id])
      expect([...store.children.get(root.id)!.keys()]).toEqual([
        child1.id
      ])
    })

    test('Removes parent entry from children map if this was the only child', async () => {
      store.removeEntry(child)
      expect([...store.children.keys()]).toEqual([RootSymbol])
    })

    test('Removes entry from expanded', async () => {
      // First, add a child to child
      const subChild = mockStoreEntry({ parent: child.id })
      store.addEntry(subChild)
      // Now, expand child
      store.expanded[child.id] = true
      // Now, remove the child
      store.removeEntry(subChild)
      // Ensure expanded does not contain child
      expect(Object.keys(store.expanded)).toEqual([RootSymbol])
    })

    test('Removes parent entry from expanded if this was the only child', async () => {
      store.expanded[root.id] = true
      store.removeEntry(child)
      expect(Object.keys(store.expanded)).toEqual([RootSymbol])
    })
    test('Removal of ancestor does not remove all children', async () => {
      store.removeEntry(root)
      expect(store.entryMap.has(child.id)).toBeTruthy()
    })

    test('Emits \'update\' event', async () => {
      const promise = testForEvent(store, 'update')
      store.removeEntry(child)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe.todo('Should changes to parent/id update maps?')

  describe('hasChildren', () => {
    let child: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      child = mockStoreEntry({ parent: root.id })
    })
    test('Returns true for root when no interface implementation is presennt', async () => {
      expect(store.hasChildren(RootSymbol)).toBe(true)
    })
    test('Returns true for root when interface implementation is presennt', async () => {
      store.interface.hasChildren = vitest.fn().mockReturnValue(false)
      expect(store.hasChildren(RootSymbol)).toBe(true)
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
    test('Uses interface.hasChildren if provided', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntries([root, child])
      expect(store.hasChildren(root)).toBe(true)
      // Now add the interface method and test that
      store.interface.hasChildren = vitest.fn().mockReturnValue(false)
      expect(store.hasChildren(root)).toBe(false)
      expect(store.interface.hasChildren).toHaveBeenCalledTimes(1)
      expect(store.interface.hasChildren).toHaveBeenCalledWith(root)
    })

    test('Ensures interface.hasChildren is called with StoreEntry even if hasChildren is called with string', async () => {
      const child = mockStoreEntry({ parent: root.id })
      store.addEntries([root, child])
      // Now add the interface method and test that
      store.interface.hasChildren = vitest.fn().mockReturnValue(false)
      expect(store.hasChildren(root.id)).toBe(false)
      expect(store.interface.hasChildren).toHaveBeenCalledTimes(1)
      expect(store.interface.hasChildren).toHaveBeenCalledWith(root)
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

    test('Collapsing any entry does not collapse ancestors', async () => {
      const dir1 = mockStoreEntry({ name: 'dir1', parent: null })
      const subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
      const subdir2 = mockStoreEntry({ name: 'subdir2', parent: subdir1.id })
      const subdir2Children: StoreEntry<MockStoreEntry>[] = [...Array(3)].map(x => mockStoreEntry({ parent: subdir2.id }))
      store.addEntries([dir1, subdir1, subdir2, ...subdir2Children])
      store.expanded[dir1.id] = true
      store.expanded[subdir1.id] = true
      store.expanded[subdir2.id] = true

      store.updateExpanded(subdir2.id, false)
      expect(store.expanded[RootSymbol]).toBe(true)
      expect(store.expanded[dir1.id]).toBe(true)
      expect(store.expanded[subdir1.id]).toBe(true)
    })

    test('Emits \'update\' event if expandedMap was modified for given entry', async () => {
      const dir1 = mockStoreEntry({ name: 'dir1', parent: root.id })
      store.addEntry(dir1)

      store.expanded[root.id] = true
      let promise = testForEvent(store, 'update', { timeout: 100 })
      store.updateExpanded(root.id, false)
      await expect(promise).resolves.toBeUndefined()

      promise = testForEvent(store, 'update', { timeout: 100 })
      store.updateExpanded(root.id, true)
      await expect(promise).resolves.toBeUndefined()
    })

    test('Does not emit event if expandMap for entry was not modified', async () => {
      // Root has no children. Try to update expanded
      let promise = testForEvent(store, 'update', { timeout: 100 })
      store.updateExpanded(root.id, true)
      await expect(promise).rejects.toThrow()

      promise = testForEvent(store, 'update', { timeout: 100 })
      store.updateExpanded(root.id, false)
      await expect(promise).rejects.toThrow()
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

  describe('getUpOneLevelEntry', () => {
    let dir1: StoreEntry<MockStoreEntry>
    let expected: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      dir1 = mockStoreEntry({ name: 'dir1', parent: root.id })
      expected = {
        name: '..',
        ...root as any
      }
      store.interface.getUpOneLevelEntry = vitest.fn().mockImplementation((item: StoreEntry<MockStoreEntry>) => expected)
      store.addEntries([root, dir1])
    })
    test('Throws error if interface does not implement method', async () => {
      store.interface.getUpOneLevelEntry = undefined
      expect(() => store.getUpOneLevelEntry(dir1)).toThrow()
    })
    test('Calls interface method if provided', async () => {
      expect(() => store.getUpOneLevelEntry(dir1)).not.toThrow()
      expect(store.interface.getUpOneLevelEntry).toHaveBeenCalledTimes(1)
      expect(store.interface.getUpOneLevelEntry).toHaveBeenCalledWith(dir1)
    })
    test('Returns interface response', async () => {
      const result = store.getUpOneLevelEntry(dir1)
      expect(result).toEqual(expected)
    })
  })

  describe('isUpOneLevelEntry', () => {
    let dir1: StoreEntry<MockStoreEntry>
    beforeEach(() => {
      dir1 = mockStoreEntry({ name: 'dir1', parent: root.id })
      store.interface.getUpOneLevelEntry = vitest.fn().mockImplementation((item: StoreEntry<MockStoreEntry>) => {
        return mockStoreEntry({
          name: '..',
          id: root.id,
          parent: null,
          size: root.size,
          lastModified: root.lastModified
        })
      })
      store.addEntries([root, dir1])
    })
    test('Returns false for regular entries', async () => {
      const value = store.isUpOneLevelEntry(dir1)
      expect(value).toBe(false)
    })

    test('Returns true for entries obtained via getUpOneLevelEntry', async () => {
      const upOneLevelEntry = store.getUpOneLevelEntry(dir1)
      expect(store.isUpOneLevelEntry(upOneLevelEntry)).toBe(true)
    })
  })
})
