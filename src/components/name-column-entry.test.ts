import { mount } from '@vue/test-utils'
import { test, expect, describe, beforeEach } from 'vitest'
import { mockStore, mockStoreEntry as GenerateMockStoreEntry } from '@/js/test-utils'
import NameColumnEntry from './name-column-entry.vue'
import { Store } from '@/js/store'
import { Defaults } from '@/js/fs-tree'

// We use something other than 'name' on purpose
const keyField = 'dummyName'

interface MockStoreEntry {
  id: string
  parent: string
  [keyField]: string
  [key: string]: any
}

describe('NameColumnEntry', () => {
  const name = 'dummy-file' // May 27 2003 09:02:24 GMT-0400
  let entry: MockStoreEntry
  let store: Store<MockStoreEntry>

  function mockStoreEntry (name?: string) {
    const tmp = GenerateMockStoreEntry({ name })
    const entry: MockStoreEntry = { ...tmp, [keyField]: tmp.name }
    delete entry.name
    return entry
  }

  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
    entry = mockStoreEntry(name)
    store.addEntry(entry)
  })

  test('Display format', async () => {
    const wrapper = mount(NameColumnEntry, {
      props: {
        keyField,
        entryId: entry.id,
        entry,
        store,
        config: Defaults
      }
    })
    expect(wrapper.text()).toEqual(name)
  })
})
