import { beforeEach, describe, expect, test } from 'vitest'
import { SortOrder } from './column'
import { ContentEntry, ISelectionPlugin, SelectionPlugin } from './selection'
import { NameSort } from './sort'
import { DepthEntry, RootSymbol, Store, StoreEntry } from './store'
import { mockStore, mockStoreEntry, MockStoreEntry, fakeMouseEvent } from './test-utils'

describe('Selection', () => {
  let store: Store<MockStoreEntry>
  let selection: ISelectionPlugin
  let contents: Record<string, DepthEntry<MockStoreEntry>>
  let contentsArray: DepthEntry<MockStoreEntry>[]
  let topLevelEntries: StoreEntry<MockStoreEntry>[]
  let dir1: StoreEntry<MockStoreEntry>
  let dir1Children: StoreEntry<MockStoreEntry>[]
  let subdir1: StoreEntry<MockStoreEntry>
  let subdir1Children: StoreEntry<MockStoreEntry>[]
  let dir2: StoreEntry<MockStoreEntry>
  let dir2Children: StoreEntry<MockStoreEntry>[]
  beforeEach(() => {
    selection = SelectionPlugin()
    store = mockStore<MockStoreEntry>()
    topLevelEntries = [...Array(3)].map((_, idx) => mockStoreEntry({ name: `top-child-${idx}`, parent: null }))
    dir1 = mockStoreEntry({ name: 'dir1', parent: null })
    dir1Children = [...Array(10)].map((_, idx) => mockStoreEntry({ name: `dir1-child-${idx}`, parent: dir1.id }))
    subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
    subdir1Children = [...Array(10)].map((_, idx) => mockStoreEntry({ name: `subdir1-child-${idx}`, parent: subdir1.id }))
    dir2 = mockStoreEntry({ name: 'dir2', parent: null })
    dir2Children = [...Array(10)].map((_, idx) => mockStoreEntry({ name: `dir2-child-${idx}`, parent: dir2.id }))
    store.addEntries([
      ...topLevelEntries,
      dir1,
      ...dir1Children,
      subdir1,
      ...subdir1Children,
      dir2,
      ...dir2Children
    ])
    // Expand dir1
    store.updateExpanded(dir1.id, true)
    updateContents(dir1.id)
  })

  const updateContents = (id?: string) => {
    id = id || RootSymbol
    const nameSort = NameSort<MockStoreEntry>('name')
    contents = store.getEntries(id, (a: StoreEntry<MockStoreEntry>, b: StoreEntry<MockStoreEntry>) => nameSort(a, b, SortOrder.Ascending, store))
    contentsArray = Object.values(contents)
  }

  describe('handleSelect', () => {
    test('Clicking on an entry selects it', async () => {
      for (let idx = 0; idx < contentsArray.length; idx += 4) {
        selection.handleSelect(fakeMouseEvent(), contentsArray, contentsArray[idx], idx)
        expect(Object.keys(selection.selected.value).length).toBe(1)
        expect(selection.selected.value[contentsArray[idx].id]).toBeTruthy()
      }
    })

    test('Passing null in place of StoreEntry resets selection', async () => {
      const selectedIndexes = [4, 5, 6]
      selectedIndexes.forEach(idx => {
        const depthEntry = contentsArray[idx]
        // Select the entry
        selection.selected.value[depthEntry.id] = depthEntry.entry
      })
      selection.handleSelect(fakeMouseEvent(), contentsArray)
      expect(selection.selected.value).toEqual({})
    })

    describe('Shift+Click', () => {
      test('Selects entry if nothing else was selected', async () => {
        const idx = 4
        selection.handleSelect(fakeMouseEvent({ shiftKey: true }), contentsArray, contentsArray[idx], idx)
        expect(Object.keys(selection.selected.value).length).toBe(1)
        expect(selection.selected.value[contentsArray[idx].id]).toEqual(contentsArray[idx].entry)
      })

      test('Works on zero-index entry', async () => {
        const idx = 0
        selection.handleSelect(fakeMouseEvent({ shiftKey: true }), contentsArray, contentsArray[idx], idx)
        expect(Object.keys(selection.selected.value).length).toBe(1)
        expect(selection.selected.value[contentsArray[idx].id]).toEqual(contentsArray[idx].entry)
      })

      test('Subsequent entry when an entry is already selected selects everything in between (inclusive)', async () => {
        const startIdx = 1
        const endIdx = 6
        selection.handleSelect(fakeMouseEvent(), contentsArray, contentsArray[startIdx], startIdx)
        selection.handleSelect(fakeMouseEvent({ shiftKey: true }), contentsArray, contentsArray[endIdx], endIdx)
        expect(Object.keys(selection.selected.value).length).toBe(Math.abs(endIdx - startIdx) + 1)

        const loopStart = Math.min(startIdx, endIdx)
        const loopEnd = Math.max(startIdx, endIdx)
        for (let idx = loopStart; idx <= loopEnd; idx++) {
          expect(selection.selected.value[contentsArray[idx].id]).toEqual(contentsArray[idx].entry)
        }
      })

      test('Prior entry when an entry is already selected selects everything in between (inclusive)', async () => {
        const startIdx = 6
        const endIdx = 1
        selection.handleSelect(fakeMouseEvent(), contentsArray, contentsArray[startIdx], startIdx)
        selection.handleSelect(fakeMouseEvent({ shiftKey: true }), contentsArray, contentsArray[endIdx], endIdx)
        expect(Object.keys(selection.selected.value).length).toBe(Math.abs(endIdx - startIdx) + 1)

        const loopStart = Math.min(startIdx, endIdx)
        const loopEnd = Math.max(startIdx, endIdx)
        for (let idx = loopStart; idx <= loopEnd; idx++) {
          expect(selection.selected.value[contentsArray[idx].id]).toEqual(contentsArray[idx].entry)
        }
      })

      test('Clears selection StoreEntry is null', async () => {
        const selectedIndexes = [4, 5, 6]
        selectedIndexes.forEach(idx => {
          const depthEntry = contentsArray[idx]
          // Select the entry
          selection.selected.value[depthEntry.id] = depthEntry.entry
        })
        // Select whitespace
        selection.updateSelection(fakeMouseEvent({ shiftKey: true }), contentsArray)

        // Assert that selection has been cleared
        expect(selection.selected.value).toEqual({})
      })
    })

    describe.each([
      ['Control', 'ctrlKey'],
      ['Meta', 'metaKey']
    ])('%s+Click', async (_, key) => {
      test('Adds previously unselected entry to selection', async () => {
        const selected: string[] = []
        for (let idx = 0; idx < contentsArray.length; idx += 4) {
          selection.handleSelect(fakeMouseEvent({ [key]: true }), contentsArray, contentsArray[idx], idx)
          selected.push(contentsArray[idx].id as string)
          expect(Object.keys(selection.selected.value).length).toEqual(selected.length)
          selected.forEach(id => {
            expect(selection.selected.value[id]).toEqual(store.entryMap[id])
          })
        }
      })
      test('De-selects previously selected entry', async () => {
        const selectedIndexes = [4, 5, 6]
        selectedIndexes.forEach(idx => {
          const depthEntry = contentsArray[idx]
          // Select the entry
          selection.selected.value[depthEntry.id] = depthEntry.entry
        })

        const deselectionIndex = selectedIndexes[0]
        const depthEntry = contentsArray[deselectionIndex]
        selection.handleSelect(fakeMouseEvent({ [key]: true }), contentsArray, depthEntry, deselectionIndex)
        expect(selection.selected.value[depthEntry.id]).toBeFalsy()
      })

      test('Behaves the same if Shift is also held', async () => {
        const selectedIndexes = [4, 5, 6]
        selectedIndexes.forEach(idx => {
          const depthEntry = contentsArray[idx]
          // Select the entry
          selection.updateSelection(fakeMouseEvent({ [key]: true, shiftKey: true }), contentsArray, depthEntry, idx)
          expect(selection.selected.value[depthEntry.id]).toEqual(depthEntry.entry)
        })

        const deselectionIndex = selectedIndexes[0]
        const depthEntry = contentsArray[deselectionIndex]
        selection.handleSelect(fakeMouseEvent({ [key]: true, shiftKey: true }), contentsArray, depthEntry, deselectionIndex)
        expect(selection.selected.value[depthEntry.id]).toBeFalsy()

        // Remaining selected indexes
        const remainingSelectedIndexes = selectedIndexes.slice(1)
        // Check that the remaining are selected
        remainingSelectedIndexes.forEach(idx => {
          const depthEntry = contentsArray[idx]
          expect(selection.selected.value[depthEntry.id]).toEqual(depthEntry.entry)
        })
      })

      test('Clears selection StoreEntry is null', async () => {
        const selectedIndexes = [4, 5, 6]
        selectedIndexes.forEach(idx => {
          const depthEntry = contentsArray[idx]
          // Select the entry
          selection.selected.value[depthEntry.id] = depthEntry.entry
        })
        // Select whitespace
        selection.updateSelection(fakeMouseEvent({ [key]: true }), contentsArray)

        // Assert that selection has been cleared
        expect(selection.selected.value).toEqual({})
      })
    })
  })

  describe('onContentsUpdated', async () => {
    let selectedIndex: number

    const select = (idx: number) => {
      selection.lastSelectedEntry.value = { index: idx, entry: contentsArray[idx] }
      selection.focusedEntry.value = { index: idx, entry: contentsArray[idx] }
    }

    beforeEach(() => {
      // Select an entry
      updateContents()
      selectedIndex = contentsArray.findIndex(x => x.id === dir1Children[2].id)
      select(selectedIndex)
    })

    test('Does not throw on no previously selected entry', async () => {
      selection.lastSelectedEntry.value = null as any as ContentEntry
      expect(() => updateContents()).not.toThrow()
    })

    test('Does not throw on no previously focused entry', async () => {
      selection.focusedEntry.value = null as any as ContentEntry
      expect(() => updateContents()).not.toThrow()
    })

    test('Removing currently selected entry updates focus even if selection is empty', async () => {
      selection.lastSelectedEntry.value = null as any as ContentEntry
      const oldEntry = contentsArray[selectedIndex].entry
      store.removeEntry(oldEntry)
      updateContents()
      selection.onContentUpdated(contentsArray, contents)
      expect(selection.lastSelectedEntry.value).toBeNull()
      expect(selection.focusedEntry.value.index).toEqual(selectedIndex)
    })

    test('Removing currently selected entry updates lastSelectedEntry even if focus is empty', async () => {
      selection.focusedEntry.value = null as any as ContentEntry
      const oldEntry = contentsArray[selectedIndex].entry
      store.removeEntry(oldEntry)
      updateContents()
      selection.onContentUpdated(contentsArray, contents)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(contentsArray[selectedIndex].entry.id)
      expect(selection.lastSelectedEntry.value.index).toEqual(selectedIndex)
      expect(selection.focusedEntry.value).toBeNull()
    })

    test('Removing currently selected entry keeps focus and selection on same index', async () => {
      const oldEntry = contentsArray[selectedIndex].entry
      store.removeEntry(oldEntry)
      updateContents()
      selection.onContentUpdated(contentsArray, contents)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(contentsArray[selectedIndex].entry.id)
      expect(selection.lastSelectedEntry.value.index).toEqual(selectedIndex)
      expect(selection.focusedEntry.value.index).toEqual(selectedIndex)
    })

    test('If selection and focus are on first index and it is removed, selection remains on first index', async () => {
      select(0)
      const oldContentEntry = contentsArray[0]
      store.removeEntry(oldContentEntry.entry)
      updateContents()
      selection.onContentUpdated(contentsArray, contents)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(contentsArray[0].entry.id)
      expect(selection.lastSelectedEntry.value.index).toEqual(0)
      expect(selection.focusedEntry.value.index).toEqual(0)
    })

    test('If selection and focus are on last index and it is removed, selection remains on last index', async () => {
      selectedIndex = contentsArray.length - 1
      const oldContentEntry = contentsArray[selectedIndex]
      select(selectedIndex)
      store.removeEntry(oldContentEntry.entry)
      updateContents()
      selection.onContentUpdated(contentsArray, contents)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(contentsArray[contentsArray.length - 1].entry.id)
      expect(selection.lastSelectedEntry.value.index).toEqual(contentsArray.length - 1)
      expect(selection.focusedEntry.value.index).toEqual(contentsArray.length - 1)
    })

    test('Adding entry before selected entry updates index but not the entry', async () => {
      const oldSelection = selection.lastSelectedEntry.value
      const oldFocus = selection.focusedEntry.value

      store.addEntry(mockStoreEntry({ name: 'aaaaaaaaaa', parent: dir1.id }))
      updateContents()
      selection.onContentUpdated(contentsArray, contents)

      expect(selection.lastSelectedEntry.value.index).not.toEqual(oldSelection.index)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(oldSelection.entry.id)
      expect(selection.focusedEntry.value.index).not.toEqual(oldFocus.index)
      expect(selection.focusedEntry.value.entry.id).toEqual(oldFocus.entry.id)
    })

    test('Adding entry after selected entry does nothing', async () => {
      const oldSelection = selection.lastSelectedEntry.value
      const oldFocus = selection.focusedEntry.value

      store.addEntry(mockStoreEntry({ name: 'zzzzzzzzzz', parent: dir1.id }))
      updateContents()
      selection.onContentUpdated(contentsArray, contents)

      expect(selection.lastSelectedEntry.value.index).toEqual(oldSelection.index)
      expect(selection.lastSelectedEntry.value.entry.id).toEqual(oldSelection.entry.id)
      expect(selection.focusedEntry.value.index).toEqual(oldFocus.index)
      expect(selection.focusedEntry.value.entry.id).toEqual(oldFocus.entry.id)
    })

    test('Does nothing if no selected/focused entry', async () => {
      selection.lastSelectedEntry.value = null as any as ContentEntry
      selection.focusedEntry.value = null as any as ContentEntry

      store.removeEntry(contentsArray[selectedIndex].entry)
      updateContents()
      expect(() => selection.onContentUpdated(contentsArray, contents)).not.toThrow()

      expect(selection.lastSelectedEntry.value).toBeNull()
      expect(selection.focusedEntry.value).toBeNull()
    })
  })
})
