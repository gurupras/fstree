<template>
<span>{{humanSize}}</span>
</template>

<script lang="ts">
import { Store, StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import filesize from 'filesize'
import type { PropType } from 'vue'

const size = filesize.partial({ round: 0, standard: 'jedec' })

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
    }
  },
  computed: {
    humanSize () {
      if (this.store.hasChildren[this.entryId]) {
        return ''
      }
      if (this.entry.size === 0) {
        return '0 KB'
      } else if (this.entry.size <= 1024) {
        return '1 KB'
      }
      const humanSize = size(this.entry.size)
      return humanSize.toUpperCase()
    }
  }
})
</script>
