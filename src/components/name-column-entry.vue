<template>
<NameNode
            :name="name"
            :config="config"
            :has-children="store.hasChildren(entryId)"
            :depth="depth"
            icon="vscode-icons:default-file"
            :expanded="store.expanded[entryId]"/>
</template>

<script lang="ts">
import { FSTreeConfig } from '@/js/fs-tree'
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
    },
    config: {
      type: Object as PropType<FSTreeConfig>,
      required: true
    }
  },
  computed: {
    name () {
      return this.entry[this.keyField]
    }
  }
})
</script>
