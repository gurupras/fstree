<script setup lang="ts">
import FsTree from '@/components/fs-tree.vue'
import { Store, StoreEntry } from '@/js/store'
import { ref } from '@vue/reactivity'
import Data from './sameple-data'

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

</script>

<template>
<div>
  <FsTree :store="store" cwd="/"/>
</div>
</template>

<style>
</style>
