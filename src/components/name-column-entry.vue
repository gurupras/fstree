<template>
<NameNode
            :name="store.getName(entry)"
            :has-children="store.hasChildren[entryId]"
            :depth="depth"
            icon="vscode-icons:default-file"
            :expanded="store.expanded[entryId]"
            @update:expanded="val => updateExpanded(entryId, val)"/>
</template>

<script lang="ts">
import { Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'

export default defineComponent({
  props: {
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
      return this.store.getName(this.entry)
    }
  },
  methods: {
    updateExpanded (id: string, val: boolean) {
      this.store.updateExpanded(id, val)
    }
  }
})
</script>
