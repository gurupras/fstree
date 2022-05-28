<template>
<th @click="updateSort">
  <span class="column-label not-selectable">
    {{label}}
  </span>
  <span class="sort-order">
    <i-mdi-chevron-up v-if="sort === SortOrder.Ascending"/>
    <i-mdi-chevron-down v-else-if="sort === SortOrder.Descending"/>
  </span>
  <div class="resizer" :class="{resizing}" @mousedown="onMouseDown" ref="resizer"></div>
</th>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { reactive } from 'vue'
import type { PropType } from 'vue'
import { useMouse } from '@vueuse/core'
import { SortOrder } from '@/js/column'

const mouse = reactive(useMouse())

export default defineComponent({
  emits: ['update:sort'],
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
      type: String as PropType<SortOrder>
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
      this.$el.style.width = `${this.w + dx}px`
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
  }
})
</script>

<style lang="scss" scoped>
th {
  position: relative;
  text-align: left;
  vertical-align: middle;
  border: 1px solid grey;
  &:last-child {
    border-right: none;
  }
  &:first-child {
    border-left: none;
  }
  padding-left: 8px;
  font-size: 0.9rem;
  cursor: pointer;

  > span {
    vertical-align: inherit;
    svg {
      vertical-align: inherit;
    }
  }

  .sort-order {
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
