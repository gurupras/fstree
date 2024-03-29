import { mount as fullMount, VueWrapper } from '@vue/test-utils'
import { test, expect, describe, beforeEach, vitest } from 'vitest'
import { NameColumn, SizeColumn, SortOrder } from '@/js/column'
import { DepthEntry, RootSymbol, Store, StoreEntry } from '@/js/store'
import Column from './column.vue'
import NameColumnEntry from './name-column-entry.vue'
import SizeColumnEntry from './size-column-entry.vue'
import DateModifiedColumnEntry from './date-modified-column-entry.vue'
import FSTree from './fs-tree.vue'
import { nextTick } from 'vue'
import { mockStore, mockStoreEntry, MockStoreEntry, fakeKeyboardEvent, fakeMouseEvent } from '@/js/test-utils'
import { Defaults, FSTreeConfig } from '@/js/fs-tree'

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
  beforeEach(async () => {
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
    wrapper = await mount({
    })
  })

  const mount = async (props?: any) => {
    const wrapper = fullMount(FSTree, {
      props: {
        store,
        cwd: RootSymbol,
        ...props
      }
    })
    await nextTick()
    return wrapper
  }

  test('Uses default config if nothing is specified', async () => {
    const wrapper = await mount({ config: undefined })
    expect(wrapper.vm.config).toEqual(Defaults)
  })

  test('Passing custom options overrides defaults', async () => {
    const config: FSTreeConfig = {
      changeDirectoryOnDoubleClick: true
    }
    const wrapper = await mount({ config })
    expect(wrapper.vm.config).toEqual(config)
  })

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
    beforeEach(async () => {
      wrapper = await mount({
        columns: [
          NameColumn,
          SizeColumn
        ]
      })
      await nextTick()
    })
    test('Only mounts specified colums', async () => {
      expect(wrapper.findAll('.column-header').length).toBe(2)
      expect(wrapper.findAllComponents(Column).length).toBe(2)
    })
    test('Applies column-specific styles', async () => {
      const width = 24
      wrapper.vm.columnWidths[NameColumn.label] = width
      await nextTick()
      const style = getComputedStyle(wrapper.find('.column-header').element)
      expect(style.getPropertyValue('width')).toEqual(`${width}px`)
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
      wrapper.vm.updateExpanded(dir1.id, true)
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
      ['store', () => store],
      ['config', () => wrapper.vm.config]
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

    test('Double-clicking a row emits \'update:cwd\' event if config option is true', async () => {
      const config: FSTreeConfig = {
        changeDirectoryOnDoubleClick: true
      }
      wrapper = await mount({ config })
      const nameNodeRoot = wrapper.findAllComponents(NameColumnEntry).find(c => c.vm.name === dir2.name)?.find('.tree-node-root')
      expect(nameNodeRoot).toBeTruthy()
      nameNodeRoot?.trigger('dblclick')
      expect(wrapper.emitted('update:cwd')?.length).toEqual(1)
      expect(wrapper.emitted('update:cwd')![0]).toEqual([dir2.id])
    })

    test('Double-clicking a row that has no children does not emit \'update:cwd\' event', async () => {
      const entry = file1
      const config: FSTreeConfig = {
        changeDirectoryOnDoubleClick: true
      }
      wrapper = await mount({ config })
      const nameNodeRoot = wrapper.findAllComponents(NameColumnEntry).find(c => c.vm.name === entry.name)?.find('.tree-node-root')
      expect(nameNodeRoot).toBeTruthy()
      nameNodeRoot!.trigger('dblclick')
      expect(wrapper.emitted('update:cwd')).toBeFalsy()
    })

    test('Double-clicking a row does not emit \'update:cwd\' event if config option is false', async () => {
      const config: FSTreeConfig = {
        changeDirectoryOnDoubleClick: false
      }
      wrapper = await mount({ config })
      const nameNodeRoot = wrapper.findAllComponents(NameColumnEntry).find(c => c.vm.name === dir2.name)?.find('.tree-node-root')
      expect(nameNodeRoot).toBeTruthy()
      nameNodeRoot!.trigger('dblclick')
      expect(wrapper.emitted('update:cwd')).toBeFalsy()
    })

    test('Reflects asynchronous store updates', async () => {
      // Set it up so that dir1 reports having children even though it has none in the store
      [...dir1Children, subdir1, ...subdir1Children].forEach(entry => store.removeEntry(entry))
      await nextTick()
      store.interface.hasChildren = vitest.fn().mockImplementation((entry: StoreEntry | string) => {
        const entryID: string = typeof entry === 'object' ? store.getId(entry) : entry
        if (entryID === dir1.id || entryID === subdir1.id) {
          return true
        }
        return store.children.has(entryID) && store.children.get(entryID)!.size > 0
      })
      expect(store.hasChildren(RootSymbol)).toBe(true)
      expect(store.hasChildren(dir1)).toBe(true)
      expect(store.getEntries(dir1.id, (a, b) => 1, 0)).toMatchObject({})
      wrapper.setProps({ cwd: dir1.id })
      await nextTick()
      expect(wrapper.vm.contentsArray).toEqual([])
      store.addEntries([
        ...dir1Children
      ])
      await nextTick()
      expect(wrapper.vm.contentsArray.map((x: StoreEntry<MockStoreEntry>) => x.id).sort()).toEqual(dir1Children.map(x => x.id).sort())
    })
  })

  describe('Methods', () => {
    test('Calling onUpdateCWD expands the entry', async () => {
      wrapper.vm.onUpdateCWD(dir2.id)
      expect(store.expanded[dir2.id]).toBe(true)
    })
    test('Does not crash when calling onUpdateCWD with null/undefined as second argument', async () => {
      for (const val of [null, undefined]) {
        expect(() => wrapper.vm.onUpdateCWD(dir2.id, val)).not.toThrow()
      }
    })
    test('Updating cwd from RootSymbol does not collapse it', async () => {
      wrapper.vm.onUpdateCWD(dir2.id, RootSymbol)
      expect(store.expanded[RootSymbol]).toBe(true)
    })
    test('Updating cwd from something other than RootSymbol collapses previous entry', async () => {
      wrapper.vm.onUpdateCWD(dir2.id, dir1.id)
      expect(store.expanded[dir1.id]).toBe(false)
    })
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

    test('Calling updateContents with no argument uses component\'s cwd', async () => {
      store.getEntries = vitest.fn().mockReturnValue({})
      wrapper.vm.updateContents()
      expect(store.getEntries).toHaveBeenCalledTimes(1)
      expect(store.getEntries).toHaveBeenCalledWith(wrapper.vm.cwd, expect.any(Function))
    })

    test('Ensure updateContents calls selectionPlugin', async () => {
      const fn = vitest.fn()
      wrapper.vm.selectionPlugin.onContentsUpdated = fn
      await wrapper.vm.updateContents()
      expect(fn).toHaveBeenCalled()
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

    test('Pressing enter key when no entry is focused does nothing', async () => {
      wrapper.vm.selectionPlugin.focusedEntry.value = null
      const evt = fakeKeyboardEvent({ key: 'Enter' })
      wrapper.vm.onKeyUp(evt)
      expect(wrapper.emitted('open')).toBeFalsy()
    })

    test('Pressing enter key when an entry is focused triggers onKeyUp', async () => {
      const fn = vitest.fn()
      wrapper.vm.onKeyUp = fn
      const idx = 0
      const depthEntry = wrapper.vm.contentsArray[idx]
      wrapper.vm.selectionPlugin.focusedEntry.value = { index: idx, entry: depthEntry, depth: 0 }
      const evt = fakeKeyboardEvent({ key: 'Enter' })
      wrapper.vm.onKeyUp(evt)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    test('Pressing enter key when an entry is focused does not trigger keyboardNavigation.onKeyboardNavigation', async () => {
      const spy = vitest.spyOn(wrapper.vm.keyboardNavigationPlugin, 'onKeyboardNavigation')
      const idx = 0
      const depthEntry = wrapper.vm.contentsArray[idx]
      wrapper.vm.selectionPlugin.focusedEntry.value = { index: idx, entry: depthEntry, depth: 0 }
      const evt = fakeKeyboardEvent({ key: 'Enter' })
      wrapper.vm.onKeyUp(evt)
      expect(spy).not.toHaveBeenCalled()
    })

    test('Calling onKeyUp with enter key triggers \'open\' event on focused entry', async () => {
      const idx = 0
      const depthEntry = wrapper.vm.contentsArray[idx]
      wrapper.vm.selectionPlugin.focusedEntry.value = { index: idx, entry: depthEntry, depth: 0 }
      const evt = fakeKeyboardEvent({ key: 'Enter' })
      wrapper.vm.onKeyUp(evt)
      expect(wrapper.emitted('open')?.length).toEqual(1)
      expect(wrapper.emitted('open')![0]).toEqual([depthEntry.entry])
    })

    test('Ensure updateContents adds parent-entry as first entry if config option is true', async () => {
      store.interface.getUpOneLevelEntry = vitest.fn().mockImplementation((entry: StoreEntry<MockStoreEntry>) => {
        return store.entryMap.get(entry.parent)
      })
      const config: FSTreeConfig = {
        changeDirectoryOnDoubleClick: true,
        parentEntry: true
      }
      wrapper = await mount({ config })
      wrapper.vm.updateContents(subdir1.id)
      await nextTick()
      const firstDepthEntry: DepthEntry = wrapper.vm.contentsArray[0]
      const entry = firstDepthEntry.entry
      expect(store.getId(entry)).toEqual(dir1.id)
    })
  })

  test('Applies sort before mount', async () => {
    expect(wrapper.vm.sortColumn).toEqual(wrapper.vm.columns[0])
    expect(wrapper.vm.sortOrder).toEqual(SortOrder.Ascending)
  })
})
