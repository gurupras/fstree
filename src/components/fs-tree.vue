<template>
<div class="fstree-root"
    tabindex="0"
    @click="$event => handleSelect($event)"
    @keyup="onKeyboardNavigation">
  <div class="header-root">
    <Column v-for="col in columns" :key="col.label"
        class="column-header"
        :style="columnStyles[col.label]"
        :label="col.label"
        :sort="sortColumn.label === col.label ? sortOrder : SortOrderEnum.Undefined"
        @update:sort="val => onSort(col, val)"
        @resize="val => { columnWidths[col.label] = val }"/>
  </div>
  <div class="body-root">
    <RecycleScroller class="scroller"
        :items="contentsArray"
        :item-size="22"
        v-slot="{ item, index }">
      <div class="entry-row" :class="{selected: selected[item.id], focused: index === focusedEntry?.index}">
        <div v-for="col in columns" :key="item.id + '-' + col.label" class="entry-column" :style="columnStyles[col.label]">
          <component :is="col.component"
              :entry-id="item.id"
              :entry="item.entry"
              :depth="item.depth"
              :store="store"
              @click.stop="$event => handleSelect($event, item, index)"
              @toggle-expand="$event => onToggleExpand($event, item.id)"/>
        </div>
      </div>
    </RecycleScroller>
  </div>
</div>
</template>

<script lang="ts">
import { DepthEntry, DepthEntryMap, EntryMap, Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'
import { Column, NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from '@/js/column'
import { RecycleScroller } from 'vue-virtual-scroller'

interface ContentEntry {
  index: number
  entry: DepthEntry
}

export default defineComponent({
  components: {
    RecycleScroller
  },
  emits: [
    'expanded',
    'select'
  ],
  props: {
    store: {
      type: Object as PropType<Store>,
      required: true
    },
    cwd: {
      type: String
    },
    columns: {
      type: Array as PropType<Column[]>,
      default: () => {
        return [
          NameColumn,
          SizeColumn,
          DateModifiedColumn
        ]
      }
    }
  },
  watch: {
    cwd (v, o) {
      this.onUpdateCWD(v, o)
    }
  },
  computed: {
    SortOrderEnum () {
      return SortOrder
    },
    columnStyles (): any {
      const result: any = {}
      for (const column of this.columns) {
        const label = column.label
        const width = this.columnWidths[label]
        result[label] = {}
        if (width) {
          result[label] = {
            'min-width': width,
            'max-width': width
          }
        }
      }
      return result
    },
    contents (): DepthEntryMap {
      const sort = (a: StoreEntry, b: StoreEntry) => this.sortColumn.sort(a, b, this.sortOrder, this.store)
      return this.store.getEntries(this.cwd as string, sort) || {}
    },
    contentsArray (): DepthEntry[] {
      return Object.values(this.contents)
    }
  },
  data () {
    return {
      sortColumn: null as any as Column,
      sortOrder: SortOrder.Undefined,
      columnWidths: {} as any,
      lastSelectedEntry: null as any as ContentEntry,
      selected: {} as EntryMap,
      focusedEntry: null as any as ContentEntry
    }
  },
  methods: {
    onUpdateCWD (n: string, o?: string) {
      if (o) {
        this.store.updateExpanded(o, false)
      }
      this.store.updateExpanded(n, true)
    },
    updateExpanded (id: string, val: boolean) {
      this.store.updateExpanded(id, val)
    },
    onSort (column: Column, order: SortOrder) {
      this.sortColumn = column
      this.sortOrder = order
    },
    handleSelect (e: MouseEvent, entry?: DepthEntry, index?: number) {
      this.updateSelection(e, entry, index)
      if (entry && index !== undefined) {
        this.lastSelectedEntry = { index, entry }
        this.focusedEntry = { index, entry }
      } else {
        this.lastSelectedEntry = null as any as ContentEntry
      }
    },
    updateSelection (e: MouseEvent | KeyboardEvent, entry?: DepthEntry, index?: number) {
      // Because we use the virtual-scroller, it inserts its own wrappers along the way.
      // As a result, the selected row ends up being the parent of .entry-row
      if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        if (!entry) {
          this.selected = {}
          return
        }
        // Replace with just this item being selected
        this.selected = {
          [entry.id]: entry
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (!entry) {
          // Nothing to do
          return
        }
        // Add this entry to selected
        if (this.selected[entry.id]) {
          delete this.selected[entry.id]
        } else {
          this.selected[entry.id] = entry
        }
      } else if (e.shiftKey) {
        if (!entry || !index) {
          // Nothing to do
          return
        }

        // We need to find all elements between the last selected entry and this one and replace all selected items with just those
        if (!this.lastSelectedEntry) {
          // There was no previously selected entry.
          // Only select this entry
          this.selected = {
            [entry.id]: entry
          }
          return
        }

        let idx1 = this.lastSelectedEntry.index
        let idx2 = index

        // Ensure idx1 is always < idx2
        if (idx1 > idx2) {
          [idx1, idx2] = [idx2, idx1]
        }
        // Now, we just need to select all entries between idx1 and idx2
        const selectedDepthEntries = this.contentsArray.slice(idx1, idx2 + 1)
        selectedDepthEntries.forEach(depthEntry => {
          this.selected[depthEntry.id] = depthEntry.entry
        })
      }
    },
    onToggleExpand (e: MouseEvent, itemId: string) {
      if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        this.updateExpanded(itemId, !this.store.expanded[itemId])
      }
    },
    onKeyboardNavigation (e: KeyboardEvent) {
      // Don't do anything if both shift and ctrl are held
      const hasMetaKey = e.ctrlKey || e.metaKey
      if (e.shiftKey && hasMetaKey) {
        return
      }
      const currentIndex = this.focusedEntry?.index
      let nextIndex: number

      const updateSelection = (index: number, force?: boolean) => {
        if (force || (e.shiftKey || !hasMetaKey)) {
          // We need to update selection if either we're regular or shift
          this.updateSelection(e, this.contentsArray[index], index)
          this.lastSelectedEntry = { index, entry: this.contentsArray[index] }
        }
      }

      const updateFocus = (index: number) => {
        this.focusedEntry = { index, entry: this.contentsArray[index] }
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
            nextIndex = Math.min(currentIndex + 1, this.contentsArray.length - 1)
          }
          updateSelection(nextIndex)
          updateFocus(nextIndex)
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
  },
  beforeMount () {
    this.onSort(this.columns[0], SortOrder.Ascending)
    if (this.cwd) {
      this.onUpdateCWD(this.cwd)
    }
  }
})
</script>

<style lang="scss">
@import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
</style>

<style lang="scss" scoped>
.fstree-root {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  border-collapse: collapse;
  background-color: var(--fstree-background-color);
  color: var(--fstree-text-color);
  overflow: hidden;

  .header-root {
    display: flex;
    flex-direction: row;
    align-items: center;
    .column-header {
      flex: 1;
      width: 100%;
      align-items: center;
      overflow: hidden;
    }
  }

  .body-root {
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;
    .scroller {
      height: 100%;
      overflow-y: auto;
      > div {

      }
    }

    .selected {
      background-color: var(--fstree-row-selected-background-color);
      color: var(--fstree-row-selected-text-color);
    }

    .focused {
      outline: var(--fstree-row-focused-outline);
      outline-offset: -1px;
    }

    ::v-deep .scroller > div:first-child {
      margin-top: 1px;
    }

    .entry-row {
      display: flex;
      flex-direction: row;
      flex: 1;
      width: 100%;
      height: var(--fstree-row-height);
      line-height: var(--fstree-row-line-height);
      &:not(.selected):hover {
        background-color: var(--fstree-row-hover-color);
      }

      .entry-column {
        flex: 1;
      }
    }
  }
}
</style>
