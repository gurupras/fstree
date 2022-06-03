import { beforeAll, beforeEach, describe, expect, test, vitest } from 'vitest'
import { SortOrder } from './column'
import { DateModifiedSort, NameSort, SizeSort, StoreSortFunction } from './sort'
import { SortFunction, Store, StoreEntry } from './store'
import { TestEntries } from './test-data-sort'

describe('Sort', () => {
  let entries: StoreEntry[]
  let store: Store
  let sort: StoreSortFunction
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

  describe('NameSort', () => {
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

    beforeAll(() => {
      sort = NameSort('name')
    })

    test('Ascending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Ascending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending)
    })
    test('Descending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Descending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending.reverse())
    })
  })

  describe('SizeSort', () => {
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
    beforeAll(() => {
      sort = SizeSort('size', 'name')
    })

    test('Ascending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Ascending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending)
    })
    test('Descending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Descending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending.reverse())
    })
  })

  describe('DateModifiedSort', () => {
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

    beforeAll(() => {
      sort = DateModifiedSort('lastModified', 'name')
    })

    test('Ascending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Ascending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending)
    })
    test('Descending', async () => {
      const data = [...entries]
      data.sort((a: StoreEntry, b: StoreEntry) => sort(a, b, SortOrder.Descending, store))
      const got = data.map(x => x.name)
      expect(got).toEqual(expectedAscending.reverse())
    })
  })
})
