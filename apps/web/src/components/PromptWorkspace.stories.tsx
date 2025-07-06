import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import PromptWorkspace from './PromptWorkspace.js';

// Mock the stores and hooks for Storybook
vi.mock('../store/jobStore.js', () => ({
  useJobStore: () => mockJobStore,
}));

vi.mock('../store/workspaceStore.js', () => ({
  useWorkspaceStore: () => mockWorkspaceStore,
}));

vi.mock('../hooks/useJobStreaming.js', () => ({
  useJobStreaming: () => mockJobStreaming,
}));

// Mock function for Storybook
const mockFn = () => {};

// Mock the stores for Storybook
const mockJobStore = {
  log: [],
  metrics: {},
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1000,
  selectedMetrics: [],
  hasUserData: false,
  setUserData: mockFn,
};

const mockWorkspaceStore = {
  template: '',
  inputData: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  setTemplate: mockFn,
  setInputData: mockFn,
  setProvider: mockFn,
  setModel: mockFn,
  startWithExample: mockFn,
  loadJobData: mockFn,
};

const mockJobStreaming = {
  outputText: '',
  streamStatus: 'complete' as 'streaming' | 'complete' | 'error',
  isExecuting: false,
  executeJob: mockFn,
  error: null as string | null,
};

const meta: Meta<typeof PromptWorkspace> = {
  title: 'Components/PromptWorkspace',
  component: PromptWorkspace,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The main workspace component that handles prompt input and job execution.',
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-gray-50 p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    onJobSelect: mockFn,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  name: 'Empty State',
  parameters: {
    docs: {
      description: {
        story: 'The initial state when no template or input data is provided.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = '';
    mockWorkspaceStore.inputData = '';
    mockJobStreaming.outputText = '';
    mockJobStreaming.error = null;
  },
};

export const WithTemplate: Story = {
  name: 'With Template',
  parameters: {
    docs: {
      description: {
        story: 'Component with a template but no input data.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = 'Summarize the following text: {{input}}';
    mockWorkspaceStore.inputData = '';
    mockJobStreaming.outputText = '';
    mockJobStreaming.error = null;
  },
};

export const WithTemplateAndInput: Story = {
  name: 'With Template and Input',
  parameters: {
    docs: {
      description: {
        story:
          'Component with both template and input data, ready for execution.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = 'Summarize the following text: {{input}}';
    mockWorkspaceStore.inputData =
      'This is a long article about artificial intelligence and its impact on society...';
    mockJobStreaming.outputText = '';
    mockJobStreaming.error = null;
  },
};

export const Streaming: Story = {
  name: 'Streaming Output',
  parameters: {
    docs: {
      description: {
        story: 'Component showing active streaming with partial output.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = 'Summarize the following text: {{input}}';
    mockWorkspaceStore.inputData =
      'This is a long article about artificial intelligence...';
    mockJobStreaming.outputText =
      'Artificial intelligence has been rapidly evolving...';
    mockJobStreaming.streamStatus = 'streaming';
    mockJobStreaming.isExecuting = true;
    mockJobStreaming.error = null;
  },
};

export const WithError: Story = {
  name: 'With Error',
  parameters: {
    docs: {
      description: {
        story: 'Component displaying an error state.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = 'Summarize the following text: {{input}}';
    mockWorkspaceStore.inputData = 'Some input data';
    mockJobStreaming.outputText = '';
    mockJobStreaming.streamStatus = 'error';
    mockJobStreaming.error =
      'Failed to connect to AI provider. Please check your API key.';
  },
};

export const CompleteOutput: Story = {
  name: 'Complete Output',
  parameters: {
    docs: {
      description: {
        story: 'Component with completed job showing full output and metrics.',
      },
    },
  },
  beforeEach: () => {
    mockWorkspaceStore.template = 'Summarize the following text: {{input}}';
    mockWorkspaceStore.inputData =
      'This is a long article about artificial intelligence...';
    mockJobStreaming.outputText =
      'This article discusses the rapid advancement of artificial intelligence and its transformative impact on various sectors of society. Key points include...';
    mockJobStreaming.streamStatus = 'complete';
    mockJobStreaming.isExecuting = false;
    mockJobStreaming.error = null;
    mockJobStore.metrics = {
      sentiment: { score: 0.7, label: 'positive' },
      readability: { grade: 8.5, level: 'college' },
      wordCount: 45,
    };
  },
};
