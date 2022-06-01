import { beforeEach, describe, expect, test } from 'vitest'
import { KeyboardNavigationCallback, KeyboardNavigationPlugin } from './keyboard-navigation'
import { ContentEntry, ISelectionPlugin, SelectionPlugin } from './selection'
import { DepthEntry, EntryMap, Store, StoreEntry } from './store'
import { mockStore, mockStoreEntry, MockStoreEntry, fakeKeyboardEvent, fakeMouseEvent, KeyboardEventData } from './test-utils'

describe('Keyboard Navigation', () => {
  let store: Store<MockStoreEntry>
  let onKeyboardNavigation: KeyboardNavigationCallback
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
    topLevelEntries = [...Array(3)].map(x => mockStoreEntry({ name: `top-level-${x}`, parent: null }))
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

    ;({ onKeyboardNavigation } = KeyboardNavigationPlugin(selection))
  })

  describe('ArrowUp', () => {
    const data: KeyboardEventData = { key: 'ArrowUp' }

    test('Focuses and selects first element when nothing is focused', async () => {
      expect(selection.focusedEntry.value).toBeNull()
      const idx = 0
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
    })

    test('Does nothing if entry is first element', async () => {
      const idx = 0
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
      // Ensure state is as expected
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })

      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
    })
    test('Moves selection and focus to previous element', async () => {
      const idx = 6
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
      // Ensure state is as expected
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })

      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      const expectedDepthEntry = contentsArray[idx - 1]
      const expectedEntry = expectedDepthEntry.entry
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [expectedEntry.id]: expectedEntry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx - 1, entry: expectedDepthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx - 1, entry: expectedDepthEntry })
    })
    describe('Shift', () => {
      const shiftData: KeyboardEventData = { ...data, shiftKey: true }
      test('Selects previous entry', async () => {
        const idx = 6
        const depthEntry = contentsArray[idx]
        const entry = depthEntry.entry

        selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
        onKeyboardNavigation(fakeKeyboardEvent(shiftData), contentsArray, store)

        const previousDepthEntry = contentsArray[idx - 1]
        const previousEntry = previousDepthEntry.entry

        expect(selection.selected.value).toEqual({
          [entry.id]: entry,
          [previousEntry.id]: previousEntry
        })
        expect(selection.lastSelectedEntry.value).toEqual({ index: idx - 1, entry: previousDepthEntry })
        expect(selection.focusedEntry.value).toEqual({ index: idx - 1, entry: previousDepthEntry })
      })
    })
  })

  describe('ArrowDown', () => {
    const data: KeyboardEventData = { key: 'ArrowDown' }

    test('Focuses and selects first element when nothing is focused', async () => {
      expect(selection.focusedEntry.value).toBeNull()
      const idx = 0
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
    })

    test('Does nothing if entry is last element', async () => {
      const idx = contentsArray.length - 1
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
      // Ensure state is as expected
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })

      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
    })
    test('Moves selection and focus to next element', async () => {
      const idx = 6
      const depthEntry = contentsArray[idx]
      const entry = depthEntry.entry
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
      // Ensure state is as expected
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx, entry: depthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })

      // Now press the key
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      const expectedDepthEntry = contentsArray[idx + 1]
      const expectedEntry = expectedDepthEntry.entry
      // Assert that the state is the same
      expect(selection.selected.value).toEqual({
        [expectedEntry.id]: expectedEntry
      })
      expect(selection.focusedEntry.value).toEqual({ index: idx + 1, entry: expectedDepthEntry })
      expect(selection.lastSelectedEntry.value).toEqual({ index: idx + 1, entry: expectedDepthEntry })
    })

    describe('Shift', () => {
      const shiftData: KeyboardEventData = { ...data, shiftKey: true }
      test('Selects next entry', async () => {
        const idx = 6
        const depthEntry = contentsArray[idx]
        const entry = depthEntry.entry

        selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
        onKeyboardNavigation(fakeKeyboardEvent(shiftData), contentsArray, store)

        const nextDepthEntry = contentsArray[idx + 1]
        const nextEntry = nextDepthEntry.entry

        expect(selection.selected.value).toEqual({
          [entry.id]: entry,
          [nextEntry.id]: nextEntry
        })
        expect(selection.lastSelectedEntry.value).toEqual({ index: idx + 1, entry: nextDepthEntry })
        expect(selection.focusedEntry.value).toEqual({ index: idx + 1, entry: nextDepthEntry })
      })
    })
  })

  describe('ArrowRight', () => {
    const data: KeyboardEventData = { key: 'ArrowRight' }
    test('Does nothing if an entry does not have children', async () => {
      const entry = dir1Children[2]
      const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
      const depthEntry = contentsArray[depthEntryIdx]
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
      const previousSelected = { ...selection.selected.value }
      const previousLastSelected = { ...selection.lastSelectedEntry.value }
      const previousLastFocused = { ...selection.focusedEntry.value }
      const previousExpandedKeys = Object.keys(store.expanded)

      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(selection.selected.value).toEqual(previousSelected)
      expect(selection.lastSelectedEntry.value).toEqual(previousLastSelected)
      expect(selection.focusedEntry.value).toEqual(previousLastFocused)
      expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
    })
    test('Expands entry if entry has children', async () => {
      const entry = subdir1
      const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
      const depthEntry = contentsArray[depthEntryIdx]
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(store.expanded[entry.id]).toBeTruthy()
    })
    describe('Shift', () => {
      const shiftData: KeyboardEventData = { ...data, shiftKey: true }
      let entry: StoreEntry<MockStoreEntry>
      let depthEntryIdx: number
      let depthEntry: DepthEntry<MockStoreEntry>
      let previousSelected: EntryMap<MockStoreEntry>
      let previousLastSelected: ContentEntry<MockStoreEntry>
      let previousLastFocused: ContentEntry<MockStoreEntry>
      let previousExpandedKeys: string[]
      beforeEach(() => {
        entry = subdir1
        depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
        depthEntry = contentsArray[depthEntryIdx]
        selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
        previousSelected = { ...selection.selected.value }
        previousLastSelected = { ...selection.lastSelectedEntry.value }
        previousLastFocused = { ...selection.focusedEntry.value }
        previousExpandedKeys = Object.keys(store.expanded)
      })
      test('Does nothing', async () => {
        onKeyboardNavigation(fakeKeyboardEvent(shiftData), contentsArray, store)

        expect(selection.selected.value).toEqual(previousSelected)
        expect(selection.lastSelectedEntry.value).toEqual(previousLastSelected)
        expect(selection.focusedEntry.value).toEqual(previousLastFocused)
        expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
      })
    })
  })

  describe('ArrowLeft', () => {
    const data: KeyboardEventData = { key: 'ArrowLeft' }
    test('Does nothing if currently selected element is a top-level element', async () => {
      const entry = dir1Children[2]
      const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
      const depthEntry = contentsArray[depthEntryIdx]
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
      const previousSelected = { ...selection.selected.value }
      const previousLastSelected = { ...selection.lastSelectedEntry.value }
      const previousLastFocused = { ...selection.focusedEntry.value }
      const previousExpandedKeys = Object.keys(store.expanded)

      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(selection.selected.value).toEqual(previousSelected)
      expect(selection.lastSelectedEntry.value).toEqual(previousLastSelected)
      expect(selection.focusedEntry.value).toEqual(previousLastFocused)
      expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
    })
    test('Jumps to parent entry if entry has no children', async () => {
      store.updateExpanded(subdir1.id, true)
      contentsArray = Object.values(store.getEntries(dir1.id))
      const entry = subdir1Children[2]
      const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
      const depthEntry = contentsArray[depthEntryIdx]
      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
      expect(selection.selected.value).toEqual({
        [entry.id]: entry
      })
      expect(selection.lastSelectedEntry.value).toEqual({ index: depthEntryIdx, entry: depthEntry })
      expect(selection.focusedEntry.value).toEqual({ index: depthEntryIdx, entry: depthEntry })
      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
    })

    test('Collapses expanded entry', async () => {
      const entry = subdir1
      const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
      const depthEntry = contentsArray[depthEntryIdx]

      store.updateExpanded(subdir1.id, true)
      contentsArray = Object.values(store.getEntries(dir1.id))

      // Now, select subdir1 and press the keys
      selection.lastSelectedEntry.value = { index: depthEntryIdx, entry: depthEntry }
      selection.focusedEntry.value = { index: depthEntryIdx, entry: depthEntry }

      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(store.expanded[subdir1.id]).toBeFalsy()
    })
    describe('Shift', () => {
      const shiftData: KeyboardEventData = { ...data, shiftKey: true }
      test('Does nothing', async () => {
        store.updateExpanded(subdir1.id, true)
        contentsArray = Object.values(store.getEntries(dir1.id))
        const entry = subdir1Children[2]
        const depthEntryIdx = contentsArray.findIndex(x => x.id === entry.id)
        const depthEntry = contentsArray[depthEntryIdx]
        selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, depthEntryIdx)
        const previousSelected = { ...selection.selected.value }
        const previousLastSelected = { ...selection.lastSelectedEntry.value }
        const previousLastFocused = { ...selection.focusedEntry.value }
        const previousExpandedKeys = Object.keys(store.expanded)

        onKeyboardNavigation(fakeKeyboardEvent(shiftData), contentsArray, store)
        expect(selection.selected.value).toEqual(previousSelected)
        expect(selection.lastSelectedEntry.value).toEqual(previousLastSelected)
        expect(selection.focusedEntry.value).toEqual(previousLastFocused)
        expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
      })
    })
    describe.each([
      ['Control', 'ctrlKey'],
      ['Meta', 'metaKey']
    ])('%s', (_, key) => {
      const keyData: KeyboardEventData = { ...data, [key]: true }
      test('Collapses all entries', async () => {
        const idx = 6
        selection.handleSelect(fakeMouseEvent(), contentsArray, contentsArray[idx], idx)

        onKeyboardNavigation(fakeKeyboardEvent(keyData), contentsArray, store)

        expect(selection.selected.value).toEqual({})
        expect(selection.lastSelectedEntry.value).toBeNull()
        expect(selection.focusedEntry.value).toBeNull()
        expect(store.expanded).toEqual({})
      })
    })
  })

  describe('Space', () => {
    const data = { key: ' ' }
    test('Does nothing on selected entry', async () => {
      const idx = 6
      const depthEntry = contentsArray[idx]

      selection.handleSelect(fakeMouseEvent(), contentsArray, depthEntry, idx)
      const previousSelected = { ...selection.selected.value }
      const previousLastSelected = { ...selection.lastSelectedEntry.value }
      const previousLastFocused = { ...selection.focusedEntry.value }
      const previousExpandedKeys = Object.keys(store.expanded)

      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(selection.selected.value).toEqual(previousSelected)
      expect(selection.lastSelectedEntry.value).toEqual(previousLastSelected)
      expect(selection.focusedEntry.value).toEqual(previousLastFocused)
      expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
    })
    test('Does nothing on unselected entry', async () => {
      const idx = 6
      const depthEntry = contentsArray[idx]

      selection.focusedEntry.value = { index: idx, entry: depthEntry }

      const previousSelected = { ...selection.selected.value }
      expect(selection.lastSelectedEntry.value).toBeNull()
      const previousLastFocused = { ...selection.focusedEntry.value }
      const previousExpandedKeys = Object.keys(store.expanded)

      onKeyboardNavigation(fakeKeyboardEvent(data), contentsArray, store)
      expect(selection.selected.value).toEqual(previousSelected)
      expect(selection.lastSelectedEntry.value).toBeNull()
      expect(selection.focusedEntry.value).toEqual(previousLastFocused)
      expect(Object.keys(store.expanded)).toEqual(previousExpandedKeys)
    })
    describe.each([
      ['Control', 'ctrlKey'],
      ['Meta', 'metaKey']
    ])('%s', (_, key) => {
      const keyData: KeyboardEventData = { ...data, [key]: true }
      test('Selects currently focused but unselected entry', async () => {
        const idx = 6
        const depthEntry = contentsArray[idx]
        const entry = depthEntry.entry
        // Ensure some entry is selected prior
        const priorSelection = {
          [contentsArray[0].id]: contentsArray[0].entry
        }
        selection.selected.value = priorSelection

        // Focus on the next entry
        selection.focusedEntry.value = { index: idx, entry: depthEntry }

        onKeyboardNavigation(fakeKeyboardEvent(keyData), contentsArray, store)
        // Ensure entry is selected in addition to prior selection
        expect(selection.selected.value).toEqual({
          ...priorSelection,
          [entry.id]: entry
        })
        // Ensure lastSelectedEntry is updated
        expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
      })

      test('De-selects currently focused and selected entry', async () => {
        const idx = 6
        const depthEntry = contentsArray[idx]
        const entry = depthEntry.entry
        // Ensure some entries are selected prior
        const priorSelection = {
          [contentsArray[0].id]: contentsArray[0].entry,
          [entry.id]: depthEntry
        }
        selection.selected.value = priorSelection

        // Focus on the next entry
        selection.focusedEntry.value = { index: idx, entry: depthEntry }

        onKeyboardNavigation(fakeKeyboardEvent(keyData), contentsArray, store)
        // Ensure entry is de-selected
        expect(selection.selected.value).toEqual({
          ...priorSelection,
          [entry.id]: undefined
        })
        // Ensure lastSelectedEntry is updated
        expect(selection.lastSelectedEntry.value).toEqual({ index: idx, entry: depthEntry })
      })

      test('Does nothing if Shift is held', async () => {
        const idx = 6
        const depthEntry = contentsArray[idx]

        // Ensure some entry is selected prior
        const priorSelection = {
          [contentsArray[0].id]: contentsArray[0].entry
        }
        selection.selected.value = priorSelection

        // Focus on the next entry
        selection.focusedEntry.value = { index: idx, entry: depthEntry }

        onKeyboardNavigation(fakeKeyboardEvent({ ...keyData, shiftKey: true }), contentsArray, store)
        // Ensure entry is selected in addition to prior selection
        expect(selection.selected.value).toEqual(priorSelection)
        // Ensure lastSelectedEntry remains the same
        expect(selection.lastSelectedEntry.value).toBeNull()
      })
    })
  })
})
