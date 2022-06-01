import { mount } from '@vue/test-utils'
import { test, expect, describe, beforeEach, vitest } from 'vitest'
import { mockStore, mockStoreEntry as GenerateMockStoreEntry } from '@/js/store.test'
import DateModifiedColumnEntry from './date-modified-column-entry.vue'
import { Store } from '@/js/store'

// We use something other than 'lastModified' on purpose
const keyField = 'dummyLastModified'

interface MockStoreEntry {
  id: string
  parent: string
  [keyField]: number
  [key: string]: any
}

describe('SizeColumnEntry', () => {
  const lastModified = 1054040547967 // May 27 2003 09:02:24 GMT-0400
  let entry: MockStoreEntry
  let store: Store<MockStoreEntry>

  function mockStoreEntry (lastModified?: number) {
    const tmp = GenerateMockStoreEntry({ lastModified })
    const entry: MockStoreEntry = { ...tmp, [keyField]: tmp.lastModified }
    delete entry.lastModified
    return entry
  }

  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
    entry = mockStoreEntry(lastModified)
    store.addEntry(entry)
  })

  test('Display format', async () => {
    const wrapper = mount(DateModifiedColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store
      }
    })
    expect(wrapper.text()).toEqual('5/27/2003 09:02 AM')
  })
})
