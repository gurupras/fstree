import type { Meta, StoryObj } from '@storybook/vue3';
import NameNode from '../components/name-node.vue'

const meta: Meta<typeof NameNode> = {
  title: 'Example/NameNode',
  component: NameNode,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'text' },
    hasChildren: { control: 'boolean' },
    expanded: { control: 'boolean' },
    depth: { control: 'number' },
    icon: { control: 'text' },
    config: { control: 'object' },
  },
  args: {
    name: 'Node Name',
    hasChildren: false,
    expanded: false,
    depth: 0,
    icon: '',
    config: {
      expandOnRowClick: false,
    },
  },
} satisfies Meta<typeof NameNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Default Node',
  },
};

export const WithChildren: Story = {
  args: {
    name: 'Node With Children',
    hasChildren: true,
    expanded: false,
  },
};

export const ExpandedNode: Story = {
  args: {
    name: 'Expanded Node',
    hasChildren: true,
    expanded: true,
  },
};

export const CustomDepth: Story = {
  args: {
    name: 'Node With Custom Depth',
    depth: 3,
  },
};

export const CustomIcon: Story = {
  args: {
    name: 'Node With Custom Icon',
    icon: 'mdi-folder',
  },
};

export const ExpandOnClick: Story = {
  args: {
    name: 'Expand on Row Click',
    hasChildren: true,
    config: {
      expandOnRowClick: true,
    },
  },
};