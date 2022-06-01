import { mount as fullMount, VueWrapper } from '@vue/test-utils'
import { test, expect, describe, beforeEach, vitest } from 'vitest'
import { NameColumn, SizeColumn, SortOrder } from '@/js/column'
import { DepthEntry, RootSymbol, Store } from '@/js/store'
import Column from './column.vue'
import NameColumnEntry from './name-column-entry.vue'
import SizeColumnEntry from './size-column-entry.vue'
import DateModifiedColumnEntry from './date-modified-column-entry.vue'
import FSTree from './fs-tree.vue'
import { nextTick } from 'vue'
import { mockStore, mockStoreEntry, MockStoreEntry, fakeKeyboardEvent, fakeMouseEvent } from '@/js/test-utils'

describe('FSTree', () => {
  let store: Store<MockStoreEntry>
  const dir1 = mockStoreEntry({ name: 'dir1', parent: null })
  const dir1Children = [...Array(3)].map(x => mockStoreEntry({ parent: dir1.id }))
  const subdir1 = mockStoreEntry({ name: 'subdir1', parent: dir1.id })
  const subdir1Children = [...Array(3)].map(x => mockStoreEntry({ parent: subdir1.id }))

  const dir2 = mockStoreEntry({ name: 'dir2', parent: null })
  const dir2Children = [...Array(3)].map(x => mockStoreEntry({ parent: dir2.id }))
  const subdir2 = mockStoreEntry({ name: 'subdir2', parent: dir2.id })
  const subdir2Children = [...Array(3)].map(x => mockStoreEntry({ parent: subdir2.id }))

  const dir3 = mockStoreEntry({ name: 'dir3', parent: null })
  const dir3Children = [...Array(3)].map(x => mockStoreEntry({ parent: dir3.id }))
  const subdir3 = mockStoreEntry({ name: 'subdir3', parent: dir3.id })
  const subdir3Children = [...Array(3)].map(x => mockStoreEntry({ parent: subdir3.id }))

  const file1 = mockStoreEntry({ name: 'file1', parent: null, size: 4096 })

  let wrapper: VueWrapper<any>
  beforeEach(() => {
    store = mockStore<MockStoreEntry>()
    store.addEntries([
      dir1,
      ...dir1Children,
      subdir1,
      ...subdir1Children,

      dir2,
      ...dir2Children,
      subdir2,
      ...subdir2Children,

      dir3,
      ...dir3Children,
      subdir3,
      ...subdir3Children,

      file1
    ])
    wrapper = mount({
      cwd: ''
    })
  })

  const mount = (props?: any) => {
    const wrapper = fullMount(FSTree, {
      props: {
        store,
        cwd: RootSymbol,
        ...props
      }
    })
    return wrapper
  }

  test('Clicking $el triggers onClick', async () => {
    const spy = vitest.spyOn(wrapper.vm, 'onClick')
    wrapper.vm.selectionPlugin.handleSelect = vitest.fn()
    wrapper.find('.fstree-root').trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.selectionPlugin.handleSelect).toHaveBeenCalledTimes(1)
  })
  test('Keyboard event on $el triggers', async () => {
    const spy = vitest.spyOn(wrapper.vm, 'onKeyUp')
    wrapper.vm.keyboardNavigationPlugin.onKeyboardNavigation = vitest.fn()
    wrapper.find('.fstree-root').trigger('keyup')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.keyboardNavigationPlugin.onKeyboardNavigation).toHaveBeenCalledTimes(1)
  })

  describe('Columns', () => {
    beforeEach(() => {
      wrapper = mount({
        columns: [
          NameColumn,
          SizeColumn
        ]
      })
    })
    test('Only mounts specified colums', async () => {
      expect(wrapper.findAll('.column-header').length).toBe(2)
      expect(wrapper.findAllComponents(Column).length).toBe(2)
    })
    test('Applies column-specific styles', async () => {
      const width = '24px'
      wrapper.vm.columnWidths[NameColumn.label] = width
      await nextTick()
      const style = getComputedStyle(wrapper.find('.column-header').element)
      expect(style.getPropertyValue('min-width')).toEqual(width)
      expect(style.getPropertyValue('max-width')).toEqual(width)
    })
    test('Binds column label properly', async () => {
      expect(wrapper.findComponent(Column).vm.label).toEqual(NameColumn.label)
    })
    test('Defaults to SortOrder.Undefined', async () => {
      expect(wrapper.findAllComponents(Column)[1].vm.sort).toEqual(SortOrder.Undefined)
    })

    test('Updates columnWidths on \'resize\' event', async () => {
      const width = '24px'
      const nameColumn = wrapper.findAllComponents(Column).find(x => x.vm.label === NameColumn.label)!
      nameColumn.vm.$emit('resize', width)
      expect(wrapper.vm.columnWidths).toMatchObject({
        [NameColumn.label]: width
      })
    })
    test('update:sort event triggers onSort', async () => {
      const spy = vitest.spyOn(wrapper.vm, 'onSort')
      wrapper.findComponent(Column).vm.$emit('update:sort', SortOrder.Descending)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(NameColumn, SortOrder.Descending)
    })
  })

  describe('Entries', () => {
    test('Shows all top-level entries', async () => {
      expect(wrapper.findAllComponents(NameColumnEntry).map(x => x.text())).toEqual([
        'dir1',
        'dir2',
        'dir3',
        'file1'
      ])

      expect(wrapper.findAllComponents(SizeColumnEntry).map(x => x.text())).toEqual([
        '',
        '',
        '',
        '4 KB'
      ])

      const years = [dir1, dir2, dir3, file1].map(x => `${new Date(x.lastModified).getFullYear()}`)
      expect(wrapper.findAllComponents(DateModifiedColumnEntry).map(x => x.text())).toEqual(years.map(x => expect.stringContaining(x)))
    })
    test('Only shows expanded entries', async () => {
      expect(wrapper.vm.contentsArray.length).toBe(4)
      store.updateExpanded(dir1.id, true)
      expect(store.expanded[RootSymbol]).toBe(true)
      expect(store.expanded[dir1.id]).toBe(true)
      await nextTick()
      const set = new Set(wrapper.vm.contentsArray.map((x: DepthEntry) => x.id))
      dir1Children.forEach(child => {
        expect(set.has(child.id)).toBe(true)
      })
    })

    test.each([
      ['entry', (entry: DepthEntry) => entry.entry],
      ['depth', (entry: DepthEntry) => entry.depth],
      ['store', () => store]
    ])('Binds %s', async (key, cb) => {
      const nameEntries = wrapper.findAllComponents(NameColumnEntry)
      for (let idx = 0; idx < wrapper.vm.contentsArray.length; idx++) {
        const entry: DepthEntry = wrapper.vm.contentsArray[idx]
        const nameEntry = nameEntries[idx]
        expect(nameEntry.vm[key]).toEqual(cb(entry))
      }
    })

    test('Clicking on a row cell triggers selection', async () => {
      const fn = vitest.fn()
      wrapper.vm.onRowClick = fn
      wrapper.findComponent(NameColumnEntry).trigger('click')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('Calls onToggleExpand on \'toggle-expand\' events', async () => {
      const fn = vitest.fn()
      wrapper.vm.onToggleExpand = fn
      wrapper.findComponent(NameColumnEntry).vm.$emit('toggle-expand')
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Methods', () => {
    test('Updating cwd calls onUpdateCWD', async () => {
      const spy = vitest.spyOn(wrapper.vm, 'onUpdateCWD')
      wrapper.setProps({ cwd: dir1.id })
      await nextTick()
      expect(spy).toHaveBeenCalledTimes(1)
    })
    test('Changing cwd updates contents', async () => {
      wrapper.setProps({ cwd: dir1.id })
      await nextTick()
      expect(wrapper.vm.contentsArray.map((x: DepthEntry) => x.entry.name).sort()).toEqual([
        ...dir1Children,
        subdir1
      ].map(x => x.name).sort())
    })

    test('Calling updateExpanded updates the store', async () => {
      store.updateExpanded = vitest.fn()
      wrapper.vm.updateExpanded(dir1.id, false)
      expect(store.updateExpanded).toHaveBeenCalledTimes(1)
      expect(store.updateExpanded).toHaveBeenCalledWith(dir1.id, false)
    })

    test('onSort updates sortColumn', async () => {
      wrapper.vm.onSort(NameColumn, SortOrder.Descending)
      expect(wrapper.vm.sortColumn).toEqual(NameColumn)
    })
    test('onSort updates sortOrder', async () => {
      wrapper.vm.onSort(NameColumn, SortOrder.Descending)
      expect(wrapper.vm.sortOrder).toEqual(SortOrder.Descending)
    })

    test('Calling onToggleExpand triggers updateExpanded', async () => {
      const spy = vitest.spyOn(wrapper.vm, 'updateExpanded')
      store.expanded[dir1.id] = true
      wrapper.vm.onToggleExpand(fakeMouseEvent(), dir1.id)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(dir1.id, false)
    })

    test('Calling onClick triggers selectionPlugin.handleSelect', async () => {
      const fn = vitest.fn()
      const evt = fakeMouseEvent()
      wrapper.vm.selectionPlugin.handleSelect = fn
      wrapper.vm.onClick(evt)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(evt, wrapper.vm.contentsArray)
    })

    test('Calling onRowClick triggers selectionPlugin.handleSelect', async () => {
      const fn = vitest.fn()
      const evt = fakeMouseEvent()
      const idx = 2
      const entry = wrapper.vm.contentsArray[idx]
      wrapper.vm.selectionPlugin.handleSelect = fn
      wrapper.vm.onRowClick(evt, entry, idx)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(evt, wrapper.vm.contentsArray, entry, idx)
    })

    test('Calling onKeyUp triggers keyboardNavigationPlugin.onKeyboardNavigation', async () => {
      const fn = vitest.fn()
      const evt = fakeKeyboardEvent({ key: 'ArrowUp' })
      wrapper.vm.keyboardNavigationPlugin.onKeyboardNavigation = fn
      wrapper.vm.onKeyUp(evt)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(evt, wrapper.vm.contentsArray, store)
    })
  })

  test('Applies sort before mount', async () => {
    expect(wrapper.vm.sortColumn).toEqual(wrapper.vm.columns[0])
    expect(wrapper.vm.sortOrder).toEqual(SortOrder.Ascending)
  })
})
