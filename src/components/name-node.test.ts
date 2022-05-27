import { mount } from '@vue/test-utils'
import { test, expect } from 'vitest'
import NameNode from './name-node.vue'

test('Adds --depth variable based on prop', () => {
  for (let idx = 0; idx < 3; idx++) {
    const wrapper = mount(NameNode, {
      props: {
        name: 'dummy',
        hasChildren: false,
        depth: idx,
        icon: 'vscode-icons:default-file'
      }
    })
    expect(getComputedStyle(wrapper.element).getPropertyValue('--depth')).toBe(`${idx}`)
  }
})

test('Does not show icon is hasChildren=true', async () => {
  const wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: true,
      icon: 'vscode-icons:default-file'
    }
  })
  expect(wrapper.find('.icon').exists()).toBe(false)
})

test('Shows icon if hasChildren=false', async () => {
  const wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: false,
      expanded: false,
      icon: 'vscode-icons:default-file'
    }
  })
  expect(wrapper.find('.icon').exists()).toBe(true)
  expect(wrapper.find('.icon').isVisible()).toBe(true)
})

test('Shows correct icon when folder is collapsed', async () => {
  const wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: false,
      icon: 'vscode-icons:default-file'
    }
  })
  expect(wrapper.find('.collapsed').isVisible()).toBe(true)
  expect(wrapper.find('.expanded').exists()).toBe(false)
})

test('Shows correct icon when folder is expanded', async () => {
  const wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: true,
      icon: 'vscode-icons:default-file'
    }
  })
  expect(wrapper.find('.expanded').isVisible()).toBe(true)
  expect(wrapper.find('.collapsed').exists()).toBe(false)
})

test('Emits \'update:expanded\' event when clicked', async () => {
  let wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: false,
      icon: 'vscode-icons:default-file'
    }
  })
  wrapper.find('.collapsed').trigger('click')
  expect(wrapper.emitted('update:expanded')).toBeTruthy()
  expect(wrapper.emitted('update:expanded')![0]).toEqual([true])

  wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: true,
      icon: 'vscode-icons:default-file'
    }
  })
  wrapper.find('.expanded').trigger('click')
  expect(wrapper.emitted('update:expanded')).toBeTruthy()
  expect(wrapper.emitted('update:expanded')![0]).toEqual([false])
})

test.each([
  ['Shift', 'shiftKey'],
  ['Control', 'ctrlKey'],
  ['Meta', 'metaKey']
])('Does not emit \'update:expanded\' if %s are held', async (_, key) => {
  const wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: true,
      icon: 'vscode-icons:default-file'
    }
  })
  wrapper.find('.expanded').trigger('click', {
    [key]: true
  })
  expect(wrapper.emitted('update:expanded')).toBeFalsy()
})

test('Emits \'select\' event when clicked', async () => {
  let wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: false,
      icon: 'vscode-icons:default-file'
    }
  })
  wrapper.find('.collapsed').trigger('click')
  expect(wrapper.emitted('select')).toBeTruthy()

  wrapper = mount(NameNode, {
    props: {
      name: 'dummy',
      hasChildren: true,
      expanded: true,
      icon: 'vscode-icons:default-file'
    }
  })
  wrapper.find('.expanded').trigger('click')
  expect(wrapper.emitted('select')).toBeTruthy()
})
