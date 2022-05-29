<template>
<div class="fstree-root" @click="$event => handleSelect($event)">
  <div class="header-root">
    <Column v-for="col in columns" :key="col.label"
        class="column-header"
        :style="columnStyles[col.label]"
        :label="col.label"
        :sort="sortColumn.label === col.label ? sortOrder : SortOrder.Undefined"
        @update:sort="val => onSort(col, val)"
        @resize="val => { columnWidths[col.label] = val }"/>
  </div>
  <div class="body-root">
    <RecycleScroller class="scroller"
        :items="Object.values(contents)"
        :item-size="22"
        :item-class="getItemClass"
        v-slot="{ item }">
      <div class="entry-row" :class="{selected: selected[item.id], focused: item.id === lastSelectedEntry?.id}">
        <div v-for="col in columns" :key="item.id + '-' + col.label" class="entry-column" :style="columnStyles[col.label]">
          <component :is="col.component"
              :entry-id="item.id"
              :entry="item.entry"
              :depth="item.depth"
              :store="store"
              @click.stop="$event => handleSelect($event, item.entry, item.id)"
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
      default () {
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
    SortOrder () {
      return SortOrder
    },
    columnStyles () {
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
    }
  },
  data () {
    return {
      sortColumn: null as any as Column,
      sortOrder: SortOrder.Undefined,
      columnWidths: {} as any,
      lastSelectedEntry: null as any as DepthEntry,
      selected: {} as EntryMap
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
    handleSelect (e: MouseEvent, entry?: StoreEntry, entryId?: string) {
      this.updateSelection(e, entry, entryId)
      if (entryId) {
        this.lastSelectedEntry = this.contents[entryId] as DepthEntry
      } else {
        this.lastSelectedEntry = null as any as DepthEntry
      }
    },
    updateSelection (e: MouseEvent, entry?: StoreEntry, entryId?: string) {
      // Because we use the virtual-scroller, it inserts its own wrappers along the way.
      // As a result, the selected row ends up being the parent of .entry-row
      if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        if (!entry || !entryId) {
          this.selected = {}
          return
        }
        // Replace with just this item being selected
        this.selected = {
          [entryId]: entry
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (!entry || !entryId) {
          // Nothing to do
          return
        }
        // Add this entry to selected
        if (this.selected[entryId]) {
          delete this.selected[entryId]
        } else {
          this.selected[entryId] = entry
        }
      } else if (e.shiftKey) {
        if (!entry || !entryId) {
          // Nothing to do
          return
        }
        const contents = Object.values(this.contents as DepthEntryMap)

        // We need to find all elements between the last selected entry and this one and replace all selected items with just those
        if (!this.lastSelectedEntry) {
          // There was no previously selected entry.
          // Only select this entry
          this.selected = {
            [entryId]: entry
          }
          return
        }

        let idx1 = -1
        let idx2 = -1
        for (let idx = 0; idx < contents.length; idx++) {
          const depthEntry = contents[idx]
          if (depthEntry.id === this.lastSelectedEntry.id) {
            idx1 = idx
          } else if (depthEntry.entry === entry) {
            idx2 = idx
          }
          if (idx1 >= 0 && idx2 >= 0) {
            break
          }
        }
        // Ensure idx1 is always < idx2
        if (idx1 > idx2) {
          [idx1, idx2] = [idx2, idx1]
        }
        // Now, we just need to select all entries between idx1 and idx2
        const selectedDepthEntries = contents.slice(idx1, idx2 + 1)
        selectedDepthEntries.forEach(depthEntry => {
          this.selected[depthEntry.id] = depthEntry.entry
        })
      }
    },
    onToggleExpand (e: MouseEvent, itemId: string) {
      if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        this.updateExpanded(itemId, !this.store.expanded[itemId])
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
