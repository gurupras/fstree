<script setup lang="ts">
import { defineComponent } from '@vue/runtime-core'

</script>

<template>
<div class="tree-node-root" :style="style" @click="handleClick">
  <div class="row">
    <div class="indent"></div>
    <div v-if="hasChildren" class="collapsible-container">
      <i-mdi-chevron-right v-if="!expanded" class="collapsible"/>
      <i-mdi-chevron-down v-else class="collapsible"/>
    </div>
    <div class="contents">
      <div v-if="!hasChildren" class="icon-container">
        <Icon :icon="icon" class="icon"/>
      </div>
      <div class="label-container">
        <span class="label">{{name}}</span>
        <slot name="description"></slot>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import { Icon } from '@iconify/vue'
export default defineComponent({
  components: {
    Icon
  },
  emits: [
    'update:expanded',
    'select'
  ],
  props: {
    name: {
      type: String,
      required: true
    },
    hasChildren: {
      type: Boolean,
      required: true
    },
    expanded: {
      type: Boolean
    },
    depth: {
      type: Number,
      default: 0
    },
    icon: {
    }
  },
  computed: {
    style () {
      return {
        '--depth': this.depth
      }
    }
  },
  data () {
    return {
    }
  },
  methods: {
    handleClick () {
      this.$emit('update:expanded', !this.expanded)
      this.$emit('select')
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-node-root {
  --row-height: 22px;
  --icon-width: 16px;
  --icon-height: 16px;
  --icon-padding-right: 6px;
  --line-height: var(--row-height, 22px);
  --root-padding-left: 4px;
  --collapsible-width: 16px;
  --font-size: 1em;
  --indent: 12px;

  position: relative;
  display: block;
  user-select: none;
  white-space: nowrap;
  touch-action: none;
  overflow-x: hidden;
  overflow-y: hidden;
  cursor: pointer;
  padding-left: var(--root-padding-left);
  height: var(--row-height);
  line-height: var(--line-height);
  font-size: var(--font-size);

  .row {
    display: flex;
    height: 100%;
    align-items: center;
    position: relative;
  }

  .indent {
    width: calc(var(--depth, 0) * var(--indent));
  }

  .collapsible-container {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--collapsible-width);
    height: 100%;
    padding-right: 6px;
  }

  .contents {
    display: flex;
    flex: 1;
    overflow: hidden;
    height: 100%;
    align-items: center;

    .icon-container {
      display: flex;
      align-items: center;
      padding-right: var(--icon-padding-right);
    }
    .icon {
      width: var(--icon-width);
      height: var(--icon-height);
    }

    .label-container {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;

      .label {
      }
    }
  }
}
</style>
