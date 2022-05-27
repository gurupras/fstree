<template>
  <span>{{dateStr}}</span>
</template>

<script lang="ts">
import { StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'

export default defineComponent({
  props: {
    entry: {
      type: Object as PropType<StoreEntry>,
      required: true
    }
  },
  computed: {
    dateStr () {
      const date = new Date(this.entry.modifiedUtc)
      return `${date.getMonth()}-${date.getDate()}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
    }
  }
})
</script>
