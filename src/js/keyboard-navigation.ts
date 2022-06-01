import { ContentEntry, ISelectionPlugin } from './selection'
import { DepthEntry, Store } from './store'

export type KeyboardNavigationCallback = (e: KeyboardEvent, contentsArray: Array<DepthEntry>, store: Store) => void

export function KeyboardNavigationPlugin (selectionPlugin: ISelectionPlugin) {
  const onKeyboardNavigation = (e: KeyboardEvent, contentsArray: Array<DepthEntry>, store: Store) => {
    // Don't do anything if both shift and ctrl are held
    const hasMetaKey = e.ctrlKey || e.metaKey
    if (e.shiftKey && hasMetaKey) {
      return
    }
    const currentIndex = selectionPlugin.focusedIndex.value
    let nextIndex: number

    const updateSelection = (index: number, force?: boolean) => {
      if (force || (e.shiftKey || !hasMetaKey)) {
        // We need to update selection if either we're regular or shift
        selectionPlugin.updateSelection(e, contentsArray, contentsArray[index], index)
        selectionPlugin.lastSelectedEntry.value = { index, entry: contentsArray[index] }
      }
    }

    const updateFocus = (index: number) => {
      selectionPlugin.focusedEntry.value = { index, entry: contentsArray[index] }
    }

    switch (e.key) {
      case 'ArrowUp': {
        if (currentIndex === undefined) {
          nextIndex = 0
        } else {
          nextIndex = Math.max(currentIndex - 1, 0)
        }
        updateSelection(nextIndex)
        updateFocus(nextIndex)
        break
      }
      case 'ArrowDown': {
        if (currentIndex === undefined) {
          nextIndex = 0
        } else {
          nextIndex = Math.min(currentIndex + 1, contentsArray.length - 1)
        }
        updateSelection(nextIndex)
        updateFocus(nextIndex)
        break
      }
      case 'ArrowRight': {
        if (e.shiftKey || hasMetaKey) {
          // Do nothing
          return
        }
        const entry = contentsArray[currentIndex]
        store.updateExpanded(entry.id as string, true)
        break
      }
      case 'ArrowLeft': {
        if (e.shiftKey) {
          // Do nothing
          return
        }
        if (hasMetaKey) {
          // Collapse all expanded
          store.expanded = {}
          // Reset selection and focus
          selectionPlugin.handleSelect({} as MouseEvent, contentsArray)
          selectionPlugin.focusedEntry.value = null as any as ContentEntry // TODO: Figure out if this should happen internally
          return
        }
        const contentEntry = contentsArray[currentIndex]
        if (!store.expanded[contentEntry.id]) {
          // This entry is not expanded. We need to jump to the parent
          const parentId = store.getParent(contentEntry.entry)
          if (!parentId) {
            return
          }
          const parentEntry = store.entryMap[parentId]
          if (!parentEntry) {
            return
          }
          // We know the parent entry has to come before the current entry
          // So go backwards from currentIndex until we find the parent.
          let parentIdx = -1
          for (let idx = currentIndex; idx >= 0; idx--) {
            if (contentsArray[idx].entry === parentEntry) {
              parentIdx = idx
              break
            }
          }
          if (parentIdx < 0) {
            // Weirdly, we didn't find a parent.
            return
          }
          updateSelection(parentIdx)
          updateFocus(parentIdx)
        } else {
          store.updateExpanded(contentEntry.id as string, false)
        }
        break
      }
      case ' ': {
        if (hasMetaKey) {
          updateSelection(currentIndex, true)
        }
        break
      }
    }
  }
  return {
    onKeyboardNavigation
  }
}
