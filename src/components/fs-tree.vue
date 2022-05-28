<template>
<table>
  <thead>
    <tr>
      <Column v-for="col in columns" :key="col.label"
          :label="col.label"
          :sort="sortColumn.label === col.label ? sortOrder : SortOrder.Undefined"
          @update:sort="val => onSort(col, val)"/>
    </tr>
  </thead>
  <tbody>
    <tr v-for="({ depth, entry }, id) in getContents()" :key="id">
      <td v-for="col in columns" :key="id + '-' + col.label">
        <component :is="col.component" :entry-id="id" :entry="entry" :depth="depth" :store="store"/>
      </td>
    </tr>
  </tbody>
</table>
</template>

<script lang="ts">
import { Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'
import { Column, NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from '@/js/column'

export default defineComponent({
  emits: [
    'expanded'
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
    }
  },
  data () {
    return {
      sortColumn: null as any as Column,
      sortOrder: SortOrder.Undefined
    }
  },
  methods: {
    onUpdateCWD (n: string, o?: string) {
      if (o) {
        this.store.updateExpanded(o, false)
      }
      this.store.updateExpanded(n, true)
    },
    getContents () {
      const sort = (a: StoreEntry, b: StoreEntry) => this.sortColumn.sort(a, b, this.sortOrder, this.store)
      return this.store.getEntries(this.cwd as string, sort)
    },
    updateExpanded (id: string, val: boolean) {
      this.store.updateExpanded(id, val)
    },
    onSort (column: Column, order: SortOrder) {
      this.sortColumn = column
      this.sortOrder = order
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

<style lang="scss" scoped>
table {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  background-color: var(--fstree-background-color);
  color: var(--fstree-text-color);
  overflow: hidden;

  thead, tbody, th, tr {
    color: inherit;
  }

  tbody {
    overflow-y: auto;
    tr {
      height: var(--fstree-row-height);
      line-height: var(--fstree-row-line-height);
      &:hover {
        background-color: var(--fstree-row-hover-color);
      }
    }
  }
}
</style>
