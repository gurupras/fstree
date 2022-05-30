import { computed, ComputedRef, ref, Ref } from 'vue'
import { DepthEntry, EntryMap } from './store'

export interface ContentEntry {
  index: number
  entry: DepthEntry
}

export interface ISelectionPlugin {
  lastSelectedEntry: Ref<ContentEntry>
  focusedEntry: Ref<ContentEntry>
  focusedIndex: ComputedRef<number>
  selected: Ref<EntryMap>
  handleSelect (e: MouseEvent, contentsArray: Array<DepthEntry>, entry?: DepthEntry, index?: number): void
  updateSelection (e: MouseEvent | KeyboardEvent, contentsArray: Array<DepthEntry>, entry ?: DepthEntry, index ?: number): void
}

export function SelectionPlugin (): ISelectionPlugin {
  const lastSelectedEntry = ref<ContentEntry>(null as any as ContentEntry)
  const focusedEntry = ref<ContentEntry>(null as any as ContentEntry)
  const focusedIndex = computed(() => focusedEntry.value?.index)
  const selected = ref<EntryMap>({})

  const handleSelect = (e: MouseEvent, contentsArray: Array<DepthEntry>, entry ?: DepthEntry, index ?: number) => {
    updateSelection(e, contentsArray, entry, index)
    if (entry && index !== undefined) {
      lastSelectedEntry.value = { index, entry }
      focusedEntry.value = { index, entry }
    } else {
      lastSelectedEntry.value = null as any as ContentEntry
    }
  }

  const updateSelection = (e: MouseEvent | KeyboardEvent, contentsArray: Array<DepthEntry>, entry ?: DepthEntry, index ?: number) => {
    // Because we use the virtual-scroller, it inserts its own wrappers along the way.
    // As a result, the selected row ends up being the parent of .entry-row
    if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
      if (!entry) {
        selected.value = {}
        return
      }
      // Replace with just this item being selected
      selected.value = {
        [entry.id]: entry
      }
    } else if (e.ctrlKey || e.metaKey) {
      if (!entry) {
        // Nothing to do
        return
      }
      // Add this entry to selected
      if (selected.value[entry.id]) {
        delete selected.value[entry.id]
      } else {
        selected.value[entry.id] = entry
      }
    } else if (e.shiftKey) {
      if (!entry || !index) {
        // Nothing to do
        return
      }

      // We need to find all elements between the last selected entry and this one and replace all selected items with just those
      if (!lastSelectedEntry.value) {
        // There was no previously selected entry.
        // Only select this entry
        selected.value = {
          [entry.id]: entry
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
