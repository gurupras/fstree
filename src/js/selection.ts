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

  return {
    lastSelectedEntry,
    focusedEntry,
    focusedIndex,
    selected,
    handleSelect,
    updateSelection
  }
}
