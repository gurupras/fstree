<script setup lang="ts">
import FsTree from '@/components/fs-tree.vue'
import { Store, StoreEntry } from '@/js/store'
import { ref } from '@vue/reactivity'

import Data from './sameple-data'

</script>

<template>
<div class="root container is-flex is-clipped">
  <div class="is-flex is-flex-direction-column is-flex-grow-1 is-clipped">
    <FsTree :store="store" cwd="/" class="fstree"/>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'

interface IStoreEntry {
  name: string
  path: string
  parent: string
  hasChildren: boolean
  size: number
  lastModified: number
}

const store = ref(new Store<IStoreEntry>({
  getId (entry: StoreEntry<IStoreEntry>) {
    return entry.path
  },
  getParent (entry: StoreEntry<IStoreEntry>) {
    if (entry.parent === '') {
      return null
    }
    return entry.parent as string
  }
}))

store.value.addEntries(Data as any as StoreEntry<IStoreEntry>[])

export default defineComponent({
  data () {
    return {
    }
  },
  methods: {

  },
  mounted () {
    window.store = store
    window.app = this
  }
})
</script>

<style lang="scss">
html, body, #app {
  margin: 0;
  height: 100%;
  overflow-y: hidden;
}
@import '@/style/themes/default.scss';
</style>
<style lang="scss" scoped>
@import 'bulma/bulma.sass';
.container {
  height: 100%;
  background-color: var(--fstree-background-color);
}
</style>
