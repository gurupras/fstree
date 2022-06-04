<template>
<div class="tree-node-root" :class="{'expand-on-row-click': config.expandOnRowClick}" :style="style" @click="onRowClick">
  <div class="row">
    <div class="indent"></div>
    <div v-if="hasChildren" class="collapsible-container">
      <i-mdi-chevron-right v-if="!expanded" class="collapsible collapsed" @click.stop="onToggleExpand"/>
      <i-mdi-chevron-down v-else class="collapsible expanded" @click.stop="onToggleExpand"/>
    </div>
    <div class="contents">
      <div v-if="!hasChildren" class="icon-container">
        <Icon :icon="icon" class="icon"/>
      </div>
      <div class="label-container">
        <span class="label-text">{{name}}</span>
        <slot name="description"></slot>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from '@vue/runtime-core'
import { FSTreeConfig } from '@/js/fs-tree'

export default defineComponent({
  components: {
    Icon
  },
  emits: [
    'toggle-expand'
  ],
  props: {
    name: {
      type: String,
      required: true
    },
    hasChildren: {
      type: Boolean,
      default: false
    },
    expanded: {
      type: Boolean
    },
    depth: {
      type: Number,
      default: 0
    },
    icon: {
    },
    config: {
      type: Object as PropType<FSTreeConfig>,
      required: true
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
    onRowClick (e: MouseEvent) {
      if (this.config.expandOnRowClick) {
        this.$emit('toggle-expand', e)
      }
    },
    onToggleExpand (e: MouseEvent) {
      this.$emit('toggle-expand', e)
    }
  }
})
</script>

<style lang="scss" scoped>
.tree-node-root {
  --fstree-name-node-icon-width: 16px;
  --fstree-name-node-icon-height: 16px;
  --fstree-name-node-icon-padding-right: 6px;
  --fstree-name-node-root-padding-left: 4px;
  --fstree-name-node-collapsible-width: 16px;
  --fstree-name-node-font-size: 1em;
  --fstree-name-node-indent: 12px;

  position: relative;
  display: block;
  user-select: none;
  white-space: nowrap;
  touch-action: none;
  overflow-x: hidden;
  overflow-y: hidden;
  &.expand-on-row-click {
    cursor: pointer;
  }
  height: var(--fstree-row-height);
  line-height: var(--fstree-row-line-height);
  font-size: var(--fstree-name-node-font-size);

  .row {
    display: flex;
    height: 100%;
    align-items: center;
    position: relative;
  }

  .indent {
    width: calc(var(--depth, 0) * var(--fstree-name-node-indent));
  }

  .collapsible-container {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: var(--fstree-name-node-collapsible-width);
    height: 100%;
    padding-right: 4px;
    padding-left: 2px;

    .collapsible {
      width: var(--fstree-name-node-icon-width);
      height: var(--fstree-name-node-icon-height);
      cursor: pointer;
      overflow: unset;
    }
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
      padding-right: var(--fstree-name-node-icon-padding-right);
    }
    .icon {
      width: var(--fstree-name-node-icon-width);
      height: var(--fstree-name-node-icon-height);
    }

    .label-container {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;

      .label-text {
      }
    }
  }
}
</style>
