<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import FsTree from '@/components/fs-tree.vue'
import { Store, StoreEntry } from '@/js/store'

import Data from './sameple-data'
import { FSTreeOptions } from './js/fs-tree'

interface IStoreEntry {
  name: string
  path: string
  parent: string
  hasChildren: boolean
  size: number
  lastModified: number
}

const store = new Store<IStoreEntry>({
  getId (entry: StoreEntry<IStoreEntry>) {
    return entry.path
  },
  getParent (entry: StoreEntry<IStoreEntry>) {
    if (entry.parent === '') {
      return null
    }
    return entry.parent as string
  }
})

store.addEntries(Data as any as StoreEntry<IStoreEntry>[])

window.store = store

onMounted(() => {
  window.app = this
})

const config: FSTreeOptions = {
  expandOnRowClick: false
}
</script>

<template>
<div class="root container is-flex is-clipped">
  <div class="is-flex is-flex-direction-column is-flex-grow-1 is-clipped">
    <FsTree :config="config" :store="store" class="fstree" ref="fstree"/>
  </div>
</div>
</template>

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
