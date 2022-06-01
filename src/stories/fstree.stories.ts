
import FSTree from '@/components/fs-tree.vue'
import { Store, StoreEntry } from '@/js/store'
import { ref } from '@vue/reactivity'

import 'bulma'
import './style.scss'
import '@/style/themes/default.scss'
import { generateLastModified, mockStore, MockStoreEntry, mockStoreEntry } from '@/js/test-utils'

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: 'Example/FSTree',
  component: FSTree
}

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { FSTree },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup () {
    return {
      args,
      store: mockStore<MockStoreEntry>('path', 'parent')
    }
  },
  data () {
    return {
      cwd: '/'
    }
  },
  methods: {
    addStoreEntries () {
      const entries = generateFakeEntries(args.count, args.bad)
      this.store.addEntries(entries)
    },
    mockStoreEntry (data?: any) {
      const entry: any = mockStoreEntry(data)
      entry.path = entry.id
      delete entry.id
      return entry
    }
  },
  mounted () {
    window.app = this
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: `
  <div class="container section" style="height: 100%">
    <div>
      <button class="button is-link" @click="addStoreEntries">Add Entries (src={{args.count}} bad-src={{args.bad || 0}})</button>
    </div>
    <div class="root">
      <FSTree :store="store" :cwd="cwd" ref="fstree"/>
    </div>
  </div>
  `
})

function generateFakeEntries (count: number, unrelated: number = 0): StoreEntry[] {
  const root = {
    name: '/',
    path: '/',
    parent: '',
    size: 0,
    lastModified: generateLastModified()
  }
  const src = {
    name: 'src',
    path: '/src',
    parent: '/',
    size: 0,
    lastModified: generateLastModified()
  }
  const badSrc = {
    name: 'bad-src',
    path: '/bad-src',
    parent: '/',
    size: 0,
    lastModified: generateLastModified()
  }
  const result: StoreEntry[] = [root, src, badSrc]

  for (let idx = 0; idx < count; idx++) {
    const countStr = `${idx}`
    const padded = countStr.padStart(6, '0')
    const name = `file-${padded}`
    const entry = {
      name,
      parent: '/src',
      path: `${src.path}/${name}`,
      size: Math.random() * 1e6,
      lastModified: generateLastModified()
    }
    result.push(entry)
  }
  for (let idx = 0; idx < unrelated; idx++) {
    const countStr = `${idx}`
    const padded = countStr.padStart(6, '0')
    const name = `file-${padded}`
    const entry = {
      name,
      parent: '/bad-src',
      path: `/bad-src/${name}`,
      size: Math.random() * 1e6,
      lastModified: generateLastModified()
    }
    result.push(entry)
  }
  return result
}

export const C100 = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
C100.args = {
  count: 100
}

export const C1000 = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
C1000.args = {
  count: 1000,
  bad: 1000
}

export const C100OutOf10K = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
C100OutOf10K.args = {
  count: 100,
  bad: 10000
}
