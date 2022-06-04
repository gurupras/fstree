import { computed, ComputedRef, ref, Ref } from 'vue'
import { DepthEntry, EntryMap } from './store'

export interface ContentEntry<T = any> {
  index: number
  entry: DepthEntry<T>
}

export interface ISelectionPlugin<T = any> {
  lastSelectedEntry: Ref<ContentEntry<T>>
  focusedEntry: Ref<ContentEntry<T>>
  focusedIndex: ComputedRef<number>
  selected: Ref<EntryMap<T>>
  handleSelect(e: MouseEvent, contentsArray: Array<DepthEntry>, depthEntry?: DepthEntry<T>, index?: number): void
  updateSelection(e: MouseEvent | KeyboardEvent, contentsArray: Array<DepthEntry>, depthEntry?: DepthEntry<T>, index ?: number): void
  updateFocus(depthEntry?: DepthEntry<T>, index?: number): void
  onContentUpdated(contentsArray: Array<DepthEntry>, contents: Record<string, DepthEntry<T>>): void
}

export function SelectionPlugin<T> (): ISelectionPlugin<T> {
  const lastSelectedEntry = ref<ContentEntry>(null as any as ContentEntry)
  const focusedEntry = ref<ContentEntry>(null as any as ContentEntry)
  const focusedIndex = computed(() => focusedEntry.value?.index)
  const selected = ref<EntryMap<T>>({})

  const handleSelect = (e: MouseEvent, contentsArray: Array<DepthEntry<T>>, depthEntry?: DepthEntry<T>, index ?: number) => {
    updateSelection(e, contentsArray, depthEntry, index)
    if (depthEntry && index !== undefined) {
      lastSelectedEntry.value = { index, entry: depthEntry }
    }
    updateFocus(depthEntry, index)
  }

  const updateFocus = (depthEntry?: DepthEntry<T>, index?: number) => {
    if (depthEntry && index !== undefined) {
      focusedEntry.value = { index, entry: depthEntry }
    } else {
      lastSelectedEntry.value = null as any as ContentEntry
    }
  }

  const updateSelection = (e: MouseEvent | KeyboardEvent, contentsArray: Array<DepthEntry<T>>, depthEntry?: DepthEntry<T>, index ?: number) => {
    // Because we use the virtual-scroller, it inserts its own wrappers along the way.
    // As a result, the selected row ends up being the parent of .entry-row
    if (!depthEntry || index === undefined) {
      selected.value = {}
      return
    }
    if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
      // Replace with just this item being selected
      selected.value = {
        [depthEntry.id]: depthEntry.entry
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Add this entry to selected
      if (selected.value[depthEntry.id]) {
        delete selected.value[depthEntry.id]
      } else {
        selected.value[depthEntry.id] = depthEntry.entry
      }
    } else if (e.shiftKey) {
      // We need to find all elements between the last selected entry and this one and replace all selected items with just those
      if (!lastSelectedEntry.value) {
        // There was no previously selected entry.
        // Only select this entry
        selected.value = {
          [depthEntry.id]: depthEntry.entry
        }
        return
      }

      let idx1 = lastSelectedEntry.value.index
      let idx2 = index

      // Ensure idx1 is always < idx2
      if (idx1 > idx2) {
        [idx1, idx2] = [idx2, idx1]
      }
      // Now, we just need to select all entries between idx1 and idx2
      const selectedDepthEntries = contentsArray.slice(idx1, idx2 + 1)
      selectedDepthEntries.forEach(depthEntry => {
        selected.value[depthEntry.id] = depthEntry.entry
      })
    }
  }

  const onContentUpdated = (contentsArray: Array<DepthEntry<T>>, contents: Record<string, DepthEntry<T>>) => {
    // We might need to update the indexes of the selected/focused entries
    const prevSelectedEntry = lastSelectedEntry.value
    const prevFocusedEntry = focusedEntry.value
    if (!prevSelectedEntry && !prevFocusedEntry) {
      return
    }

    let newSelectedDepthEntry: DepthEntry<T>
    let newFocusedDepthEntry: DepthEntry<T>
    let newSelectedContentEntry: ContentEntry<T> | undefined
    let newFocusedContentEntry: ContentEntry<T> | undefined

    let newSelectedIdx = -1
    let newFocusedIdx = -1

    if (prevSelectedEntry) {
      newSelectedDepthEntry = contents[prevSelectedEntry.entry.id]
      if (!newSelectedDepthEntry) {
        newSelectedIdx = Math.min(prevSelectedEntry.index, contentsArray.length - 1)
        newSelectedDepthEntry = contentsArray[newSelectedIdx]
        newSelectedContentEntry = { index: newSelectedIdx, entry: newSelectedDepthEntry }
      }
    }

    if (prevFocusedEntry) {
      newFocusedDepthEntry = contents[prevFocusedEntry.index]
      if (!newFocusedDepthEntry) {
        newFocusedIdx = Math.min(prevFocusedEntry.index, contentsArray.length - 1)
        newFocusedDepthEntry = contentsArray[newFocusedIdx]
        newFocusedContentEntry = { index: newFocusedIdx, entry: newFocusedDepthEntry }
      }
    }

    if ((prevSelectedEntry && newSelectedIdx === -1) || (prevFocusedEntry && newFocusedIdx === -1)) {
      // Either previously selected entry or focused entry exists and we haven't figured out its index yet
      for (let idx = 0; idx < contentsArray.length; idx++) {
        const depthEntry = contentsArray[idx]
        if (prevSelectedEntry && prevSelectedEntry.entry.id === depthEntry.id) {
          newSelectedContentEntry = { index: idx, entry: depthEntry }
          newSelectedIdx = idx
        }
        if (prevFocusedEntry && prevFocusedEntry.entry.id === depthEntry.id) {
          newFocusedContentEntry = { index: idx, entry: depthEntry }
          newFocusedIdx = idx
        }
        if ((!prevSelectedEntry || (prevSelectedEntry && newSelectedIdx >= 0)) &&
            (!prevFocusedEntry || (prevFocusedEntry && newFocusedIdx >= 0))) {
          break
        }
      }
    }

    if (newSelectedContentEntry) {
      lastSelectedEntry.value = newSelectedContentEntry
    }
    if (newFocusedContentEntry) {
      updateFocus(newFocusedContentEntry.entry, newFocusedContentEntry.index)
    }
  }

  return {
    lastSelectedEntry,
    focusedEntry,
    focusedIndex,
    selected,
    handleSelect,
    updateSelection,
    updateFocus,
    onContentUpdated
  }
}
