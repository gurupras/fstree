import { beforeEach, describe, expect, test } from 'vitest'
import { ISelectionPlugin, SelectionPlugin } from './selection'
import { DepthEntry, Store, StoreEntry } from './store'
import { mockStore, mockStoreEntry, MockStoreEntry, fakeMouseEvent } from './test-utils'

describe('Selection', () => {
  let store: Store<MockStoreEntry>
  let selection: ISelectionPlugin
  let contentsArray: DepthEntry<MockStoreEntry>[]
  let topLevelEntries: StoreEntry<MockStoreEntry>[]
  let dir1: StoreEntry<MockStoreEntry>
  let dir1Children: StoreEntry<MockStoreEntry>[]
  let subdir1: StoreEntry<MockStoreEntry>
  let subdir1Children: StoreEntry<MockStoreEntry>[]
  beforeEach(() => {
    selection = SelectionPlugin()
    store = mockStore<MockStoreEntry>()
    topLevelEntries = [...Array(3)].map(x => mockStoreEntry({ parent: null }))
    dir1 = mockStoreEntry({ name: 'dir1', parent: null })
    dir1Children = [...Array(10)].map(x => mockStoreEntry({ parent: dir1.id }))
    subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
    subdir1Children = [...Array(10)].map(x => mockStoreEntry({ parent: subdir1.id }))
    store.addEntries([
      ...topLevelEntries,
      dir1,
      ...dir1Children,
      subdir1,
      ...subdir1Children
    ])
    // Expand dir1
    store.updateExpanded(dir1.id, true)
    const data = store.getEntries(dir1.id)
    contentsArray = Object.values(data)
  })

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
})
