<template>
<div class="fstree-root"
    tabindex="0"
    @click="onClick"
    @keyup="onKeyUp">
  <div class="body-root">
    <RecycleScroller class="scroller"
        ref="scroller"
        :items="contentsArray"
        :item-size="22"
        @resize="onTableResize">
      <template #before>
      <div class="table header-root">
        <div class="table-row">
          <Column v-for="(col, idx) in columns" :key="col.label"
              class="table-cell column-header"
              :style="columnStyles[col.label]"
              :label="col.label"
              :sort="sortColumn.label === col.label ? sortOrder : SortOrder.Undefined"
              :ref="'column-' + col.label"
              @update:sort="(val: SortOrder) => onSort(col, val)"
              @resize="(val: number) => onResizeColumn(idx, val)"/>
        </div>
      </div>
      </template>
      <template v-slot="{ item, index }: { item: import('@/js/store').DepthEntry, index: number }">
        <div class="entry-row" :class="{selected: selectionPlugin.selected.value[item.id], focused: index === selectionPlugin.focusedIndex.value}">
          <div v-for="col in columns" :key="item.id + '-' + col.label" class="entry-column table-cell" :style="columnStyles[col.label]">
            <component :is="col.component"
                :entry-id="item.id"
                :entry="item.entry"
                :depth="item.depth"
                :store="store"
                :key-field="col.keyField"
                :config="config"
                :parent-entry="store.isUpOneLevelEntry(item.entry)"
                @click.stop="($event: MouseEvent) => onRowClick($event, item, index)"
                @toggle-expand="($event: MouseEvent) => onToggleExpand($event, item.id)"
                @dblclick.stop="($event: MouseEvent) => onRowDoubleClick($event, item, index)"/>
          </div>
        </div>
      </template>
    </RecycleScroller>
  </div>
</div>
</template>

<script lang="ts">
import { DepthEntry, DepthEntryMap, RootSymbol, Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'
import { ref, computed } from 'vue'
import { Column, NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from '@/js/column'
import { RecycleScroller } from 'vue-virtual-scroller'

import { SelectionPlugin } from '@/js/selection'
import { KeyboardNavigationPlugin } from '@/js/keyboard-navigation'
import { FSTreeConfig, Defaults } from '@/js/fs-tree'

export default defineComponent({
  components: {
    RecycleScroller
  },
  emits: [
    'expanded',
    'select',
    'update:cwd',
    'open'
  ],
  props: {
    store: {
      type: Object as PropType<Store>,
      required: true
    },
    cwd: {
      type: String,
      default: () => RootSymbol
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
    },
    config: {
      type: Object as PropType<FSTreeConfig>,
      default: () => {
        return Defaults
      }
    }
  },
  setup (props) {
    const el = ref(null)

    const selectionPlugin = SelectionPlugin()
    const keyboardNavigationPlugin = KeyboardNavigationPlugin(selectionPlugin)
    const width = ref(0)
    const columnWidths = ref<Record<string, number>>({})
    const columnStyles = computed(() => {
      const result: Record<string, Record<string, string>> = {}
      for (const column of props.columns) {
        const label = column.label
        const width = columnWidths.value[label]
        result[label] = {}
        if (width) {
          result[label] = {
            width: `${width}px`
          }
        }
      }
      return result
    })
    return {
      el,
      selectionPlugin,
      keyboardNavigationPlugin,
      SortOrder,
      columnWidths,
      columnStyles,
      width
    }
  },
  watch: {
    cwd (v, o) {
      this.onUpdateCWD(v, o)
    }
  },
  computed: {
    contentsArray (): DepthEntry[] {
      return Object.values(this.contents)
    }
  },
  data () {
    return {
      sortColumn: null as any as Column,
      sortOrder: SortOrder.Undefined,
      contents: {} as DepthEntryMap
    }
  },
  methods: {
    onUpdateCWD (n: string, o?: string) {
      if (o && o !== RootSymbol) {
        this.updateExpanded(o, false)
      }
      this.updateExpanded(n, true)
    },
    updateExpanded (id: string, val: boolean) {
      this.store.updateExpanded(id, val)
    },
    onSort (column: Column, order: SortOrder, updateContents = true) {
      this.sortColumn = column
      this.sortOrder = order
      if (updateContents) {
        this.updateContents()
      }
    },

    onToggleExpand (e: MouseEvent, itemId: string) {
      if (!e.shiftKey && !(e.metaKey || e.ctrlKey)) {
        this.updateExpanded(itemId, !this.store.expanded[itemId])
      }
    },
    onClick (e: MouseEvent) {
      this.selectionPlugin?.handleSelect(e, this.contentsArray)
    },
    onKeyUp (e: KeyboardEvent) {
      if (this.selectionPlugin && e.key === 'Enter') {
        const depthEntry = this.selectionPlugin.focusedEntry.value?.entry
        if (!depthEntry) {
          // No focused entry
          return
        }
        this.$emit('open', depthEntry.entry)
        return
      }
      if (this.keyboardNavigationPlugin) {
        this.keyboardNavigationPlugin.onKeyboardNavigation(e, this.contentsArray, this.store)
      }
    },
    onRowClick (e: MouseEvent, item: DepthEntry, index: number) {
      this.selectionPlugin?.handleSelect(e, this.contentsArray, item, index)
    },
    onRowDoubleClick (e:MouseEvent, item: DepthEntry, index: number) {
      if (!this.config.changeDirectoryOnDoubleClick || !this.store.hasChildren(item.id)) {
        return
      }
      this.$emit('update:cwd', item.id)
    },
    async updateContents (cwd?: string) {
      cwd = cwd || this.cwd
      const sort = (a: StoreEntry, b: StoreEntry) => this.sortColumn.sort(a, b, this.sortOrder, this.store)
      this.contents = {}
      if (cwd !== RootSymbol && this.config.parentEntry) {
        // We need to add the parent entry first
        const parentEntry: StoreEntry = this.store.getUpOneLevelEntry(this.store.entryMap[cwd])
        const parentID = this.store.getId(parentEntry)
        this.contents[parentID] = { id: this.store.getId(parentEntry), entry: parentEntry, depth: 0 }
      }
      const contents = this.store.getEntries(cwd, sort) || {}
      Object.entries(contents).forEach(([k, v]) => {
        this.contents[k] = v
      })
      this.selectionPlugin?.onContentsUpdated(this.contentsArray, this.contents)
    },
    onResizeColumn (index: number, newWidth: number) {
      const column = this.columns[index]
      const nextColumn = this.columns[index + 1]
      if (nextColumn) {
        // This can happen if the last column emits an initial ressize
        const currentWidth = this.columnWidths[column.label]
        if (currentWidth !== undefined) {
          const nextColumnWidth = parseInt(this.columnStyles[nextColumn.label].width, 10)
          const diff = newWidth - currentWidth
          const newNNextColumnWidth = nextColumnWidth - diff
          this.columnWidths[nextColumn.label] = newNNextColumnWidth
        }
      }
      // Resizing this column involves reducing the width of this column and increasing the width of the next column such that the total width remains the same
      // TODO: Maybe store width as a property on $el
      // Add this to the next column
      this.columnWidths[column.label] = newWidth
    },
    onTableResize () {
      const style = getComputedStyle(this.$refs.scroller.$el)
      const newWidth = parseInt(style.width, 10)

      this.width = newWidth
      // Need to resize all columns to stay wiithin this new width
      const currentColumnWidths: Record<string, number> = {}
      const newColumnWidths: Record<string, number> = {}
      const oldWidth = Object.entries(this.columnWidths).map(([label, width]: [label: string, width: number]) => {
        currentColumnWidths[label] = width
        return width
      }).reduce((a, b) => a + b, 0)

      let sum = 0
      for (const column of this.columns) {
        const { label } = column
        const ratio = currentColumnWidths[label] / oldWidth
        const width = newWidth * ratio
        newColumnWidths[label] = width
        sum += width
      }
      const diff = newWidth - sum
      if (diff !== 0) {
        // Add the diff to the last column
        newColumnWidths[this.columns[this.columns.length - 1].label] += diff
      }
      this.columnWidths = newColumnWidths
    }
  },
  beforeMount () {
    this.store.on('update', this.updateContents)
    this.onSort(this.columns[0], SortOrder.Ascending, false)
    this.onUpdateCWD(this.cwd, undefined)
    if (this.cwd === RootSymbol) {
      // We need to manually update contents
      this.updateContents()
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
  font-family: system-ui,Ubuntu,Droid Sans,sans-serif;
  font-size: 14px;

  .table {
    display: table;
    table-layout: fixed;
    width: 100%;

  }
  .table-row {
    display: table-row;
    width: 100%;
  }
  .table-cell {
    display: table-cell;
  }

  .header-root {
    .column-header {
      overflow: hidden;
      &:last-child {
        :deep(.resizer) {
          display: none;
        }
      }
    }
  }

  .body-root {
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;

    .selected {
      background-color: var(--fstree-row-selected-background-color);
      color: var(--fstree-row-selected-text-color);
    }

    .focused {
      outline: var(--fstree-row-focused-outline);
      outline-offset: -1px;
    }

    .scroller {
      height: 100%;
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;

      :deep(.scroller > div:first-child) {
        margin-top: 1px;
      }

      :deep(.vue-recycle-scroller__item-wrapper) {
        display: table;
        table-layout: fixed;

        .vue-recycle-scroller__item-view {
          display: table-row;
          height: var(--fstree-row-height);
          line-height: var(--fstree-row-line-height);
        }
      }

      .entry-row {
        display: flex;
        width: 100%;
        height: var(--fstree-row-height);
        line-height: var(--fstree-row-line-height);
        &:not(.selected):hover {
          background-color: var(--fstree-row-hover-color);
        }

        .entry-column {
          display: table-cell;
          max-height: var(--fstree-row-height);
          height: var(--fstree-row-height);
          line-height: var(--fstree-row-line-height);
        }
      }
    }
  }
}
</style>
