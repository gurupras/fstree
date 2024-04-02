import FSTree from '@/components/fs-tree.vue';
import { generateLastModified, mockStore, mockStoreEntry } from '@/js/test-utils';
import type { Meta, StoryObj } from '@storybook/vue3';

import 'bulma';
import './style.scss';
import '@/style/themes/default.scss';

const meta: Meta<typeof FSTree> = {
  title: 'Example/FSTree',
  component: FSTree,
  argTypes: {
    count: { control: 'number' },
    bad: { control: 'number' },
  },
} satisfies Meta<typeof FSTree>;

export default meta;
type Story = StoryObj<typeof meta>;

const Template: Story = {
  render(args) {
    return {
      components: { FSTree },
      setup() {
        const store = mockStore('path', 'parent');
        return { args, store };
      },
      data() {
        return {
          cwd: '/',
        };
      },
      methods: {
        addStoreEntries() {
          const entries = generateFakeEntries(args.count, args.bad);
          this.store.addEntries(entries);
        },
        mockStoreEntry(data?: any) {
          const entry: any = mockStoreEntry(data);
          entry.path = entry.id;
          delete entry.id;
          return entry;
        },
      },
      mounted() {
        window.app = this;
      },
      template: `
        <div class="container section" style="height: 100%">
          <div>
            <button class="button is-link" @click="addStoreEntries">Add Entries (src={{args.count}} bad-src={{args.bad || 0}})</button>
          </div>
          <div class="root">
            <FSTree :store="store" :cwd="cwd" ref="fstree"/>
          </div>
        </div>
      `,
    };
  },
};

function generateFakeEntries(count: number, unrelated: number = 0): StoreEntry[] {
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

export const C100: Story = {
  ...Template,
  args: {
    count: 100,
  },
};

export const C1000: Story = {
  ...Template,
  args: {
    count: 1000,
    bad: 1000,
  },
};

export const C100OutOf10K: Story = {
  ...Template,
  args: {
    count: 100,
    bad: 10000,
  },
};