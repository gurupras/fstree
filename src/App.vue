<script setup lang="ts">
import FsTree from '@/components/fs-tree.vue'
import { Store, StoreEntry } from '@/js/store'
import { ref } from '@vue/reactivity'

import Data from './sameple-data'

</script>

<template>
<div class="root container is-flex">
  <div class="is-flex is-flex-direction-column is-flex-grow-1">
    <FsTree :store="store" cwd="/" class="fstree"/>
  </div>
</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'

const store = ref(new Store({
  getId (entry: StoreEntry) {
    return entry.path as string
  },
  getParent (entry: StoreEntry) {
    if (entry.parent === '') {
      return null
    }
    return entry.parent as string
  },
  getName (entry: StoreEntry) {
    return entry.name as string
  }
}))

store.value.addEntries(Data)

export default defineComponent({
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
