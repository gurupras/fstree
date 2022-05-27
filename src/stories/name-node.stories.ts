import NameNode from '../components/name-node.vue'

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: 'Example/NameNode',
  component: NameNode,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {
    name: { type: 'String' }
  }
}

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template = (args) => ({
  // Components used in your story `template` are defined in the `components` object
  components: { TreeNode: NameNode },
  // The story's `args` need to be mapped into the template through the `setup()` method
  setup () {
    return { args }
  },
  // And then the `args` are bound to your component with `v-bind="args"`
  template: '<tree-node v-bind="args" />'
})

export const File = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
File.args = {
  name: 'example.pdf',
  icon: 'vscode-icons:file-type-pdf2'
}

export const Folder = Template.bind({})
// More on args: https://storybook.js.org/docs/vue/writing-stories/args
Folder.args = {
  name: 'src',
  hasChildren: true
}
