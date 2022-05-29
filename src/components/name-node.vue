<template>
<div class="tree-node-root" :style="style" @click="$event => $emit('toggle-expand', $event)">
  <div class="row">
    <div class="indent"></div>
    <div v-if="hasChildren" class="collapsible-container">
      <i-mdi-chevron-right v-if="!expanded" class="collapsible collapsed"/>
      <i-mdi-chevron-down v-else class="collapsible expanded"/>
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
import { Icon } from '@iconify/vue'
import { defineComponent } from '@vue/runtime-core'
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
  cursor: pointer;
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
