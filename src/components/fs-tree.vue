<template>
<div class="fstree-root"
    tabindex="0"
    @click="$event => selectionPlugin.handleSelect($event, contentsArray)"
    @keyup="$event => keyboardNavigationPlugin.onKeyboardNavigation($event, contentsArray, store)">
  <div class="header-root">
    <Column v-for="col in columns" :key="col.label"
        class="column-header"
        :style="columnStyles[col.label]"
        :label="col.label"
        :sort="sortColumn.label === col.label ? sortOrder : SortOrder.Undefined"
        @update:sort="(val: SortOrder) => onSort(col, val)"
        @resize="(val: string) => { columnWidths[col.label] = val }"/>
  </div>
  <div class="body-root">
    <RecycleScroller class="scroller"
        :items="contentsArray"
        :item-size="22"
        v-slot="{ item, index }">
      <div class="entry-row" :class="{selected: selectionPlugin.selected.value[item.id], focused: index === selectionPlugin.focusedIndex.value}">
        <div v-for="col in columns" :key="item.id + '-' + col.label" class="entry-column" :style="columnStyles[col.label]">
          <component :is="col.component"
              :entry-id="item.id"
              :entry="item.entry"
              :depth="item.depth"
              :store="store"
              :key-field="col.keyField"
              @click.stop="($event: MouseEvent) => selectionPlugin.handleSelect($event, contentsArray, item, index)"
              @toggle-expand="($event: MouseEvent) => onToggleExpand($event, item.id)"/>
        </div>
      </div>
    </RecycleScroller>
  </div>
</div>
</template>

<script lang="ts">
import { DepthEntry, DepthEntryMap, Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'
import { Column, NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from '@/js/column'
import { RecycleScroller } from 'vue-virtual-scroller'

import { SelectionPlugin } from '@/js/selection'
import { KeyboardNavigationPlugin } from '@/js/keyboard-navigation'

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
  setup () {
    const selectionPlugin = SelectionPlugin()
    const keyboardNavigationPlugin = KeyboardNavigationPlugin(selectionPlugin)
    return {
      selectionPlugin,
      keyboardNavigationPlugin,
      SortOrder
    }
  },
  watch: {
    cwd (v, o) {
      this.onUpdateCWD(v, o)
    }
  },
  computed: {
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
      columnWidths: {} as any
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
  font-family: system-ui,Ubuntu,Droid Sans,sans-serif;
  font-size: 14px;

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
    }

    .selected {
      background-color: var(--fstree-row-selected-background-color);
      color: var(--fstree-row-selected-text-color);
    }

    .focused {
      outline: var(--fstree-row-focused-outline);
      outline-offset: -1px;
    }

    :deep(.scroller > div:first-child) {
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
