import { beforeEach, describe, expect, test, vitest } from 'vitest'
import { NameColumn, SizeColumn, DateModifiedColumn, SortOrder } from './column'
import NameColumnEntry from '@/components/name-column-entry.vue'
import SizeColumnEntry from '@/components/size-column-entry.vue'
import DateModifiedColumnEntry from '@/components/date-modified-column-entry.vue'
import { Store, StoreEntry } from './store'
import { TestEntries } from './test-data-sort'

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
    entries = JSON.parse(JSON.stringify(TestEntries))
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
