<script setup lang="ts">
import { onMounted, ref } from 'vue'
import FsTree from './components/fs-tree.vue'
import { RootSymbol, Store, StoreEntry } from './js/store'

import Data from './sameple-data'
import { FSTreeConfig } from './js/fs-tree'

interface IStoreEntry {
  name: string
  path: string
  parent: string
  hasChildren: boolean
  size: number
  lastModified: number
}

const cwd = ref(RootSymbol)

const store = new Store<IStoreEntry>({
  getId (entry: StoreEntry<IStoreEntry>) {
    return entry.path
  },
  getParent (entry: StoreEntry<IStoreEntry>) {
    if (!entry.parent) {
      return null
    }
    return entry.parent as string
  },
  getUpOneLevelEntry (entry: StoreEntry<IStoreEntry>): StoreEntry<IStoreEntry> {
    let parent: StoreEntry<IStoreEntry> | null = null
    const parentID = this.getParent(entry)
    if (!parentID) {
      // We need to send back the root entry
      parent = {
        name: '', // Overridden below
        path: RootSymbol,
        parent: '',
        hasChildren: true,
        size: 0,
        lastModified: entry.lastModified
      }
    } else {
      parent = store.entryMap.get(parentID)!
    }
    return {
      name: '..',
      path: parent.path,
      parent: RootSymbol,
      hasChildren: false,
      size: 0,
      lastModified: parent.lastModified
    }
  }
})

store.addEntries(Data as any as StoreEntry<IStoreEntry>[])

const onOpen = (entry: StoreEntry<IStoreEntry>) => {
  if (store.hasChildren(entry)) {
    cwd.value = entry.path
  }
}

;(window as any).store = store

onMounted(() => {
  ;(window as any).app = this
})

const config: FSTreeConfig = {
  changeDirectoryOnDoubleClick: true,
  parentEntry: true
}
</script>

<template>
<div class="root container is-flex is-clipped">
  <div class="is-flex is-flex-direction-column is-flex-grow-1 is-clipped">
    <FsTree :config="config" :store="store" :cwd="cwd" class="fstree" ref="fstree"
        @update:cwd="val => { cwd = val }"
        @open="onOpen"/>
  </div>
</div>
</template>

<style lang="scss">
html, body, #app {
  margin: 0;
  height: 100%;
  overflow-y: hidden;
}
@import './style/themes/default.scss';
</style>
<style lang="scss" scoped>
@import 'bulma/bulma.sass';
.container {
  height: 60%;
  resize: both;
}
</style>
