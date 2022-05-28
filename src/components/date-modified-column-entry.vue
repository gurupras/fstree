<template>
  <span>{{dateStr}}</span>
</template>

<script lang="ts">
import { StoreEntry } from '@/js/store'
import { defineComponent } from '@vue/runtime-core'
import type { PropType } from 'vue'

const dateFormat = new Intl.DateTimeFormat(navigator.language)
const timeFormat = new Intl.DateTimeFormat(navigator.language, {
  hour: '2-digit',
  minute: '2-digit'
})

export default defineComponent({
  props: {
    entry: {
      type: Object as PropType<StoreEntry>,
      required: true
    }
  },
  computed: {
    dateStr () {
      const date = new Date(this.entry.lastModified)
      return `${dateFormat.format(date)} ${timeFormat.format(date)}`
    }
  }
})
</script>
