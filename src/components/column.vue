<template>
<div class="column-root">
  <span class="column-label not-selectable" @click.stop="updateSort">
    {{label}}
  </span>
  <span class="sort-order" @click="updateSort">
    <i-mdi-chevron-up v-if="sort === SortOrder.Ascending"/>
    <i-mdi-chevron-down v-else-if="sort === SortOrder.Descending"/>
  </span>
  <div class="resizer" :class="{resizing}" @mousedown="onMouseDown" ref="resizer"></div>
</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { reactive } from 'vue'
import type { PropType } from 'vue'
import { useMouse } from '@vueuse/core'
import { SortOrder } from '@/js/column'

const mouse = reactive(useMouse())

export default defineComponent({
  emits: ['update:sort', 'resize'],
  props: {
    label: {
      type: String,
      required: true
    },
    resizable: {
      type: Boolean,
      default: true
    },
    width: {
      type: String
    },
    sort: {
      type: String as PropType<SortOrder>,
      default: () => {
        return SortOrder.Undefined
      }
    }
  },
  data () {
    return {
      x: 0,
      w: 0,
      resizing: false
    }
  },
  computed: {
    SortOrder () {
      return SortOrder
    }
  },
  methods: {
    onMouseDown () {
      this.x = mouse.x
      const styles = getComputedStyle(this.$el)
      this.w = parseInt(styles.width, 10)

      this.resizing = true
      document.addEventListener('mousemove', this.onMouseMove)
      document.addEventListener('mouseup', this.onMouseUp)
    },
    onMouseMove () {
      const dx = mouse.x - this.x
      this.$emit('resize', this.w + dx)
    },
    onMouseUp () {
      document.removeEventListener('mousemove', this.onMouseMove)
      document.removeEventListener('mouseup', this.onMouseUp)
      this.resizing = false
    },
    updateSort () {
      let val: SortOrder
      switch (this.sort) {
        case SortOrder.Ascending:
          val = SortOrder.Descending
          break
        default:
          val = SortOrder.Ascending
          break
      }
      this.$emit('update:sort', val)
    }
  },
  mounted () {
    const styles = getComputedStyle(this.$el)
    const width = parseInt(styles.width, 10)
    this.$emit('resize', width)
  }
})
</script>

<style lang="scss" scoped>
.column-root {
  position: relative;
  text-align: left;
  border: 1px solid grey;
  &:last-child {
    border-right: none;
  }
  &:first-child {
    border-left: none;
  }
  font-size: 0.9rem;
  cursor: pointer;

  .sort-order, .column-label {
    display: inline-flex;
    align-items: center;
  }

  .column-label {
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: 8px;
  }

  .sort-order {
    align-items: center;
    float: right;
    padding-right: 14px;
  }

  .resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 5px;
    height: 100%;
    cursor: col-resize;
    user-select: none;
  }

  .resizer:hover, .resizing {
    border-right: 2px solid blue;
  }
}
</style>
