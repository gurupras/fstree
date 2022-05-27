<template>
<th>
  {{label}}
  <div class="resizer" :class="{resizing}" @mousedown="onMouseDown" ref="resizer"></div>
</th>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { reactive } from 'vue'
import { useMouse } from '@vueuse/core'

const mouse = reactive(useMouse())

export default defineComponent({
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
    }
  },
  data () {
    return {
      x: 0,
      w: 0,
      resizing: false
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
    }
  }
})
</script>

<style lang="scss" scoped>
th {
  position: relative;
  text-align: left;
  border: 1px solid grey;
  border-left: none;
  padding-left: 8px;
  font-size: 0.9rem;

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
