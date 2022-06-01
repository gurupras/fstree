<template>
<NameNode
            :name="name"
            :has-children="store.hasChildren(entryId)"
            :depth="depth"
            icon="vscode-icons:default-file"
            :expanded="store.expanded[entryId]"/>
</template>

<script lang="ts">
import { Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'

export default defineComponent({
  props: {
    keyField: {
      type: String,
      required: true
    },
    entryId: {
      type: String,
      required: true
    },
    entry: {
      type: Object as PropType<StoreEntry>,
      required: true
    },
    store: {
      type: Object as PropType<Store>,
      required: true
    },
    depth: {
      type: Number
    }
  },
  computed: {
    name () {
      return this.entry[this.keyField]
    }
  }
})
</script>
