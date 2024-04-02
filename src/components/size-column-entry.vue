<template>
<span>{{humanSize}}</span>
</template>

<script lang="ts">
import { Store, StoreEntry } from '../js/store'
import { defineComponent } from '@vue/runtime-core'
import { partial } from 'filesize'
import type { PropType } from 'vue'

const size = partial({ round: 0, standard: 'jedec' })

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
    }
  },
  computed: {
    humanSize () {
      if (this.store.hasChildren(this.entryId)) {
        return ''
      }
      if (this.entry[this.keyField] === 0) {
        return '0 KB'
      } else if (this.entry[this.keyField] <= 1024) {
        return '1 KB'
      }
      const humanSize = size(this.entry[this.keyField])
      return humanSize.toUpperCase()
    }
  }
})
</script>
