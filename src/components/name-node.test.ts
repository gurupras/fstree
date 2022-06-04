import { Defaults, FSTreeConfig } from '@/js/fs-tree'
import { mount as fullMount } from '@vue/test-utils'
import { test, expect, describe } from 'vitest'
import NameNode from './name-node.vue'

describe('NameNode', () => {
  const mount = (props?: any) => {
    const wrapper = fullMount(NameNode, {
      props: {
        name: 'dummy',
        hasChildren: false,
        expanded: false,
        icon: 'vscode-icons:default-file',
        config: Defaults,
        ...props
      }
    })
    return wrapper
  }

  test('Passing custom options overrides defaults', async () => {
    const config: FSTreeConfig = {
      changeDirectoryOnDoubleClick: true
    }
    const wrapper = mount({ config })
    expect(wrapper.vm.config).toEqual(config)
  })

  test('Adds --depth variable based on prop', () => {
    for (let idx = 0; idx < 3; idx++) {
      const wrapper = mount({ depth: idx })
      expect(getComputedStyle(wrapper.element).getPropertyValue('--depth')).toBe(`${idx}`)
    }
  })

  test('Class \'expand-on-row-click\' is conditional based on config', async () => {
    let wrapper = mount({ config: { expandOnRowClick: false } })
    expect(wrapper.element.classList.contains('expand-on-row-click')).toBe(false)
    wrapper = mount({ config: { expandOnRowClick: true } })
    expect(wrapper.element.classList.contains('expand-on-row-click')).toBe(true)
  })

  test('Does not show icon is hasChildren=true', async () => {
    const wrapper = mount({
      hasChildren: true
    })
    expect(wrapper.find('.icon').exists()).toBe(false)
  })

  test('Shows icon if hasChildren=false', async () => {
    const wrapper = mount({ hasChildren: false })
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.find('.icon').isVisible()).toBe(true)
  })

  test('Shows correct icon when folder is collapsed', async () => {
    const wrapper = mount({ hasChildren: true, expanded: false })
    expect(wrapper.find('.collapsed').isVisible()).toBe(true)
    expect(wrapper.find('.expanded').exists()).toBe(false)
  })

  test('Shows correct icon when folder is expanded', async () => {
    const wrapper = mount({ hasChildren: true, expanded: true })
    expect(wrapper.find('.expanded').isVisible()).toBe(true)
    expect(wrapper.find('.collapsed').exists()).toBe(false)
  })

  test('Emits \'toggle-expand\' event when expanded icon is clicked', async () => {
    const wrapper = mount({
      hasChildren: true,
      expanded: true,
      config: {
        expandOnRowClick: false
      }
    })
    wrapper.find('.expanded').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
    expect((wrapper.emitted('toggle-expand')![0] as Array<any>)[0]).toBeInstanceOf(MouseEvent)
  })

  test('Emits \'toggle-expand\' event when collapsed icon is clicked', async () => {
    const wrapper = mount({
      hasChildren: true,
      expanded: false,
      config: {
        expandOnRowClick: false
      }
    })
    wrapper.find('.collapsed').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
    expect((wrapper.emitted('toggle-expand')![0] as Array<any>)[0]).toBeInstanceOf(MouseEvent)
  })

  test('Does not emit \'toggle-expand\' on row-click if config option is false', async () => {
    const wrapper = mount({
      hasChildren: true,
      expanded: false,
      config: {
        expandOnRowClick: false
      }
    })
    wrapper.find('.tree-node-root').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeFalsy()
  })
  test('Emits \'toggle-expand\' event on row-click if config option is true', async () => {
    const wrapper = mount({
      hasChildren: true,
      expanded: false,
      config: {
        expandOnRowClick: true
      }
    })
    wrapper.find('.tree-node-root').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
    expect((wrapper.emitted('toggle-expand')![0] as Array<any>)[0]).toBeInstanceOf(MouseEvent)
  })

  test.each([
    ['Shift', 'shiftKey'],
    ['Control', 'ctrlKey'],
    ['Meta', 'metaKey']
  ])('Does not emit \'update:expanded\' if %s are held', async (_, key) => {
    const wrapper = mount({ hasChildren: true, expanded: true })
    wrapper.find('.expanded').trigger('click', {
      [key]: true
    })
    expect(wrapper.emitted('update:expanded')).toBeFalsy()
  })
})
