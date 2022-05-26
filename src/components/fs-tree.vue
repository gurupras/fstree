<template>
<div>
  <TreeNode v-for="({ depth, entry }, id) in getContents()" :key="id"
      :name="store.getName(entry)"
      :has-children="store.hasChildren[id]"
      :depth="depth"
      icon="vscode-icons:default-file"
      :expanded="store.expanded[id]"
      @update:expanded="val => updateExpanded(id, val)"/>
</div>
</template>

<script lang="ts">
import { Store } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'

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
