import { mount } from '@vue/test-utils'
import { test, expect, describe, beforeEach, vitest } from 'vitest'
import { mockStore, mockStoreEntry as GenerateMockStoreEntry } from '@/js/store.test'
import SizeColumnEntry from './size-column-entry.vue'
import { Store } from '@/js/store'

// We use something other than 'size' on purpose
const keyField = 'dummySize'

interface MockStoreEntry {
  id: string
  parent: string
  [keyField]: number
  [key: string]: any
}

describe('SizeColumnEntry', () => {
  const size = 1024
  let entry: MockStoreEntry
  let store: Store<MockStoreEntry>

  function mockStoreEntry (size?: number) {
    const tmp = GenerateMockStoreEntry({ size })
    const entry: MockStoreEntry = { ...tmp, [keyField]: tmp.size }
    delete entry.size
    return entry
  }

  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
    entry = mockStoreEntry(size)
    store.addEntry(entry)
  })

  test('Displays nothing as size for entries that have children', async () => {
    // Fake it as though this entry has children
    store.hasChildren = vitest.fn().mockReturnValue(true)
    const wrapper = mount(SizeColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store
      }
    })
    expect(wrapper.text()).toEqual('')
  })

  test('Displays \'1 KB\' for all entries < 1024 bytes', async () => {
    entry[keyField] = 100
    const wrapper = mount(SizeColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store
      }
    })
    expect(wrapper.text()).toEqual('1 KB')
  })

  test('Displays \'0 KB\' for entries having size 0', async () => {
    entry[keyField] = 0
    const wrapper = mount(SizeColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store
      }
    })
    expect(wrapper.text()).toEqual('0 KB')
  })

  test.each([
    ['1 MB', (1024 * 1024) + 1],
    ['4 MB', 4 * 1024 * 1024],
    ['1 GB', (1024 * 1024 * 1024) + 1024]
  ])('Displays proper size (%s)', async (text, size) => {
    entry[keyField] = size
    const wrapper = mount(SizeColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store
      }
    })
    expect(wrapper.text()).toEqual(text)
  })
})
