import { beforeEach, describe, expect, test, vitest } from 'vitest'
import { NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from './column'
import NameColumnEntry from '@/components/name-column-entry.vue'
import SizeColumnEntry from '@/components/size-column-entry.vue'
import DateModifiedColumnEntry from '@/components/date-modified-column-entry.vue'
import { Store, StoreEntry } from './store'

describe('Column', () => {
  let entries: StoreEntry[]
  let store: Store
  beforeEach(() => {
    store = new Store({
      getId: vitest.fn().mockImplementation(x => x),
      getParent: vitest.fn()
    })
    store.hasChildren = vitest.fn().mockImplementation((x: StoreEntry) => {
      return x.hasChildren
    })

    entries = [
      {
        name: 'coverage',
        hasChildren: true,
        size: 4096,
        lastModified: 1654000560000
      },
      {
        name: '.git',
        hasChildren: true,
        size: 4096,
        lastModified: 1653962940000
      },
      {
        name: 'node_modules',
        hasChildren: true,
        size: 4096,
        lastModified: 1653963720000
      },
      {
        name: 'public',
        hasChildren: true,
        size: 4096,
        lastModified: 1653247860000
      },
      {
        name: 'src',
        hasChildren: true,
        size: 4096,
        lastModified: 1653260340000
      },
      {
        name: '.storybook',
        hasChildren: true,
        size: 4096,
        lastModified: 1653247860000
      },
      {
        name: 'storybook-static',
        hasChildren: true,
        size: 4096,
        lastModified: 1653267660000
      },
      {
        name: '.vscode',
        hasChildren: true,
        size: 4096,
        lastModified: 1653961860000
      },
      {
        name: 'components.d.ts',
        hasChildren: false,
        size: 1232,
        lastModified: 1653744900000
      },
      {
        name: '.eslintrc.js',
        hasChildren: false,
        size: 318,
        lastModified: 1653247860000
      },
      {
        name: '.gitignore',
        hasChildren: false,
        size: 74,
        lastModified: 1653635340000
      },
      {
        name: 'index.html',
        hasChildren: false,
        size: 337,
        lastModified: 1653247860000
      },
      {
        name: 'package.json',
        hasChildren: false,
        size: 1804,
        lastModified: 1653993840000
      },
      {
        name: 'package-lock.json',
        hasChildren: false,
        size: 1621555,
        lastModified: 1653963720000
      },
      {
        name: 'README.md',
        hasChildren: false,
        size: 966,
        lastModified: 1653247860000
      },
      {
        name: 'tsconfig.json',
        hasChildren: false,
        size: 614,
        lastModified: 1653904140000
      },
      {
        name: 'tsconfig.node.json',
        hasChildren: false,
        size: 142,
        lastModified: 1653247860000
      },
      {
        name: 'vite.config.ts',
        hasChildren: false,
        size: 655,
        lastModified: 1653997860000
      }

    ]
  })
  describe('NameColumn', () => {
    test('Uses the NameColumnEntry component', async () => {
      expect(NameColumn.component).toBe(NameColumnEntry)
    })
    describe('Sort', () => {
      const expectedAscending = [
        '.git',
        '.storybook',
        '.vscode',
        'coverage',
        'node_modules',
        'public',
        'src',
        'storybook-static',
        '.eslintrc.js',
        '.gitignore',
        'components.d.ts',
        'index.html',
        'package-lock.json',
        'package.json',
        'README.md',
        'tsconfig.json',
        'tsconfig.node.json',
        'vite.config.ts'
      ]
      test('Ascending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => NameColumn.sort(a, b, SortOrder.Ascending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending)
      })
      test('Descending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => NameColumn.sort(a, b, SortOrder.Descending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending.reverse())
      })
    })
  })

  describe('SizeColumn', () => {
    const expectedAscending = [
      '.git',
      '.storybook',
      '.vscode',
      'coverage',
      'node_modules',
      'public',
      'src',
      'storybook-static',
      '.gitignore',
      'tsconfig.node.json',
      '.eslintrc.js',
      'index.html',
      'tsconfig.json',
      'vite.config.ts',
      'README.md',
      'components.d.ts',
      'package.json',
      'package-lock.json'
    ]

    test('Uses the SizeColumnEntry component', async () => {
      expect(SizeColumn.component).toBe(SizeColumnEntry)
    })
    describe('Sort', () => {
      test('Ascending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => SizeColumn.sort(a, b, SortOrder.Ascending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending)
      })

      test('Descending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => SizeColumn.sort(a, b, SortOrder.Descending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending.reverse())
      })
    })
  })

  describe('DateModifiedColumn', () => {
    test('Uses the DateModifiedColumnEntry component', async () => {
      expect(DateModifiedColumn.component).toBe(DateModifiedColumnEntry)
    })
    describe('Sort', () => {
      const expectedAscending = [
        '.storybook',
        'public',
        '.eslintrc.js',
        'index.html',
        'README.md',
        'tsconfig.node.json',
        'src',
        'storybook-static',
        '.gitignore',
        'components.d.ts',
        'tsconfig.json',
        '.vscode',
        '.git',
        'node_modules',
        'package-lock.json',
        'package.json',
        'vite.config.ts',
        'coverage'
      ]
      test('Ascending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => DateModifiedColumn.sort(a, b, SortOrder.Ascending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending)
      })

      test('Descending', async () => {
        const data = [...entries]
        data.sort((a: StoreEntry, b: StoreEntry) => DateModifiedColumn.sort(a, b, SortOrder.Descending, store))
        const got = data.map(x => x.name)
        expect(got).toEqual(expectedAscending.reverse())
      })
    })
  })
})
