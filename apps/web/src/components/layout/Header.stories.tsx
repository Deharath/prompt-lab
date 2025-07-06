import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header.js';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main header component with navigation and sidebar controls.',
      },
    },
  },
  argTypes: {
    sidebarCollapsed: {
      control: 'boolean',
      description: 'Whether the sidebar is collapsed',
    },
    onToggleSidebar: {
      action: 'sidebar toggled',
      description: 'Callback when sidebar toggle is clicked',
    },
    onToggleMobileSidebar: {
      action: 'mobile sidebar toggled',
      description: 'Callback when mobile sidebar toggle is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default State',
  args: {
    sidebarCollapsed: false,
    onToggleSidebar: () => {},
    onToggleMobileSidebar: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'The default header state with sidebar expanded.',
      },
    },
  },
};

export const SidebarCollapsed: Story = {
  name: 'Sidebar Collapsed',
  args: {
    sidebarCollapsed: true,
    onToggleSidebar: () => {},
    onToggleMobileSidebar: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Header state when the sidebar is collapsed.',
      },
    },
  },
};

export const Interactive: Story = {
  name: 'Interactive Example',
  args: {
    sidebarCollapsed: false,
    onToggleSidebar: () => console.log('Sidebar toggled'),
    onToggleMobileSidebar: () => console.log('Mobile sidebar toggled'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive header with console logging for button clicks.',
      },
    },
  },
};
