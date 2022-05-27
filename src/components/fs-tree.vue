<template>
<table>
  <thead>
    <tr>
      <Column label="Name"/>
      <Column v-for="col in columns" :key="col.label"
          :label="col.label"/>
    </tr>
  </thead>
  <tbody>
    <tr v-for="({ depth, entry }, id) in getContents()" :key="id">
      <td>
        <NameNode
            :name="store.getName(entry)"
            :has-children="store.hasChildren[id]"
            :depth="depth"
            icon="vscode-icons:default-file"
            :expanded="store.expanded[id]"
            @update:expanded="val => updateExpanded(id, val)"/>
      </td>
      <td v-for="col in columns" :key="id + '-' + col.label">
        <component :is="col.component" :entry-id="id" :entry="entry" :store="store"/>
      </td>
    </tr>
  </tbody>
</table>
</template>

<script lang="ts">
import { Store } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'
import { Column, SizeColumn, DateModifiedColumn } from '@/js/column'

export default defineComponent({
  emits: [
    'expanded'
  ],
  props: {
    store: {
      type: Store,
      required: true
    },
    cwd: {
      type: String
    },
    columns: {
      type: Array as PropType<Column[]>,
      default () {
        return [
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
  },
  methods: {
    onUpdateCWD (n: string, o?: string) {
      if (o) {
        this.store.updateExpanded(o, false)
      }
      this.store.updateExpanded(n, true)
    },
    getContents () {
      return this.store.getEntries(this.cwd as string)
    },
    updateExpanded (id: string, val: boolean) {
      this.store.updateExpanded(id, val)
    }
  },
  beforeMount () {
    if (this.cwd) {
      this.onUpdateCWD(this.cwd)
    }
  }
})
</script>

<style lang="scss" scoped>
table {
  --row-hover-color: rgba(120, 120, 120, 0.4);
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;

  tbody tr {
    &:hover {
      background-color: var(--row-hover-color);
    }
  }
}
</style>
