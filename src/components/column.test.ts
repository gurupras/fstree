import { mount as fullMount } from '@vue/test-utils'
import { test, expect, describe, vitest } from 'vitest'
import { SortOrder } from '@/js/column'
import Column from './column.vue'

describe('Column', () => {
  const mount = (props?: any) => fullMount(Column, {
    props: {
      label: 'dummy',
      resizable: false,
      ...props
    }
  })

  test('Clicking on column label triggers updateSort', async () => {
    const wrapper = mount()
    const spy = vitest.spyOn(wrapper.vm, 'updateSort')
    wrapper.find('.column-label').trigger('click')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  test('Clicking on column label triggers \'update:sort\'', async () => {
    const wrapper = mount()
    wrapper.find('.column-label').trigger('click')
    expect(wrapper.emitted()['update:sort'].length).toEqual(1)
  })
  test('Prop label is rendered', async () => {
    const wrapper = mount()
    expect(wrapper.find('.column-label').text()).toEqual(wrapper.vm.label)
  })

  test('No sort order by default', async () => {
    const wrapper = mount()
    expect(wrapper.find('.sort-order').element.children.length).toBe(0)
  })

  test('Ascending sort order shows correct icon', async () => {
    const wrapper = mount({
      sort: SortOrder.Ascending
    })
    expect(wrapper.find('i-mdi-chevron-up')).toBeTruthy()
    expect(wrapper.find('i-mdi-chevron-down').exists()).toBe(false)
  })

  test('Descending sort order shows correct icon', async () => {
    const wrapper = mount({
      sort: SortOrder.Descending
    })
    expect(wrapper.find('i-mdi-chevron-down')).toBeTruthy()
    expect(wrapper.find('i-mdi-chevron-up').exists()).toBe(false)
  })

  test('Triggering mousedown on resizer triggers onMouseDown', async () => {
    const wrapper = mount()
    const spy = vitest.spyOn(wrapper.vm, 'onMouseDown')
    wrapper.find('.resizer').trigger('mousedown')
    expect(spy).toHaveBeenCalledTimes(1)
  })
  test('onMouseDown sets up event listeners on document', async () => {
    const wrapper = mount()
    const documentSpy = vitest.spyOn(document, 'addEventListener')
    wrapper.vm.onMouseDown()
    expect(documentSpy).toHaveBeenCalledTimes(2)
    expect(documentSpy).toHaveBeenNthCalledWith(1, 'mousemove', wrapper.vm.onMouseMove)
    expect(documentSpy).toHaveBeenNthCalledWith(2, 'mouseup', wrapper.vm.onMouseUp)
  })
  test('onMouseDown sets resizing to true', async () => {
    const wrapper = mount()
    wrapper.vm.onMouseDown()
    expect(wrapper.vm.resizing).toBe(true)
  })

  test('Triggering mousemove after mousedown calls onMouseMove', async () => {
    const wrapper = mount()
    const spy = vitest.spyOn(wrapper.vm, 'onMouseMove')
    wrapper.find('.resizer').trigger('mousedown')
    document.dispatchEvent(new CustomEvent('mousemove'))
    expect(spy).toHaveBeenCalled()
  })
  test('onMouseMove emits \'resize\' event', async () => {
    const wrapper = mount()
    const resizeLength = wrapper.emitted().resize?.length || 0
    wrapper.vm.onMouseMove()
    expect(wrapper.emitted().resize.length).toBeGreaterThan(resizeLength)
  })

  test('Calling onMouseup detaches listeners', async () => {
    const wrapper = mount()
    const documentSpy = vitest.spyOn(document, 'removeEventListener')
    wrapper.vm.onMouseUp()
    expect(documentSpy).toHaveBeenNthCalledWith(1, 'mousemove', wrapper.vm.onMouseMove)
    expect(documentSpy).toHaveBeenNthCalledWith(2, 'mouseup', wrapper.vm.onMouseUp)
  })
  test('Calling onMouseup sets resizing to false', async () => {
    const wrapper = mount()
    wrapper.vm.resizing = true
    wrapper.vm.onMouseUp()
    expect(wrapper.vm.resizing).toBe(false)
  })

  test.each([
    [SortOrder.Ascending, SortOrder.Descending],
    [SortOrder.Undefined, SortOrder.Ascending],
    [SortOrder.Descending, SortOrder.Ascending]
  ])('Calling updateSort flips %s to %s', async (from, to) => {
    const wrapper = mount({
      sort: from
    })
    wrapper.vm.updateSort()
    expect(wrapper.emitted()['update:sort'].length).toEqual(1)
    expect(wrapper.emitted()['update:sort'][0]).toEqual([to])
  })

  test('Mounted hook triggers \'resize\' event', async () => {
    const wrapper = mount()
    expect(wrapper.emitted().resize.length).toEqual(1)
  })
})
