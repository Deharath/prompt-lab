import type { Meta, StoryObj } from '@storybook/react';
import UnifiedPanel from './UnifiedPanel.js';

const meta: Meta<typeof UnifiedPanel> = {
  title: 'Components/UnifiedPanel',
  component: UnifiedPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The unified panel component that handles prompt input, data input, and results display.',
      },
    },
  },
  argTypes: {
    template: {
      control: 'text',
      description: 'The prompt template with placeholders',
    },
    inputData: {
      control: 'text',
      description: 'The input data (JSON or plain text)',
    },
    model: {
      control: 'select',
      options: ['gpt-4o-mini', 'gpt-4', 'gpt-3.5-turbo', 'claude-3.5-sonnet'],
      description: 'The AI model to use',
    },
    isEmptyState: {
      control: 'boolean',
      description: 'Whether the panel is in empty state',
    },
    hasResults: {
      control: 'boolean',
      description: 'Whether results are available to display',
    },
    onTemplateChange: {
      action: 'template changed',
      description: 'Callback when template is modified',
    },
    onInputDataChange: {
      action: 'input data changed',
      description: 'Callback when input data is modified',
    },
    onStartWithExample: {
      action: 'start with example clicked',
      description: 'Callback when start with example is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  name: 'Empty State',
  args: {
    template: '',
    inputData: '',
    model: 'gpt-4o-mini',
    isEmptyState: true,
    hasResults: false,
    metrics: undefined,
    onTemplateChange: () => {},
    onInputDataChange: () => {},
    onStartWithExample: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'The panel in its initial empty state with no template or input data.',
      },
    },
  },
};

export const WithTemplate: Story = {
  name: 'With Template Only',
  args: {
    template:
      'Summarize the following text in a professional tone:\n\n{{input}}',
    inputData: '',
    model: 'gpt-4o-mini',
    isEmptyState: false,
    hasResults: false,
    metrics: undefined,
    onTemplateChange: () => {},
    onInputDataChange: () => {},
    onStartWithExample: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with a template but no input data yet.',
      },
    },
  },
};

export const WithTemplateAndInput: Story = {
  name: 'With Template and Input',
  args: {
    template: 'Analyze the sentiment of this text:\n\n{{input}}',
    inputData:
      'I absolutely love this new feature! It makes everything so much easier and more intuitive.',
    model: 'gpt-4',
    isEmptyState: false,
    hasResults: false,
    metrics: undefined,
    onTemplateChange: () => {},
    onInputDataChange: () => {},
    onStartWithExample: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel with both template and input data, ready for execution.',
      },
    },
  },
};

export const WithJSONInput: Story = {
  name: 'With JSON Input Data',
  args: {
    template:
      'Create a personalized email greeting for:\n\nName: {{name}}\nRole: {{role}}\nCompany: {{company}}',
    inputData:
      '{\n  "name": "John Smith",\n  "role": "Senior Developer",\n  "company": "TechCorp Inc."\n}',
    model: 'gpt-4o-mini',
    isEmptyState: false,
    hasResults: false,
    metrics: undefined,
    onTemplateChange: () => {},
    onInputDataChange: () => {},
    onStartWithExample: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Panel configured with a template that uses structured JSON input data.',
      },
    },
  },
};

export const WithResults: Story = {
  name: 'With Results',
  args: {
    template: 'Analyze the sentiment of this text:\n\n{{input}}',
    inputData:
      'I absolutely love this new feature! It makes everything so much easier and more intuitive.',
    model: 'gpt-4',
    isEmptyState: false,
    hasResults: true,
    metrics: {
      sentiment: {
        score: 0.85,
        label: 'positive',
        confidence: 0.92,
      },
      readability: {
        grade: 8.2,
        level: 'college',
        score: 'easy',
      },
      wordCount: 16,
      characterCount: 96,
    },
    onTemplateChange: () => {},
    onInputDataChange: () => {},
    onStartWithExample: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Panel displaying results with metrics after job completion.',
      },
    },
  },
};

export const Interactive: Story = {
  name: 'Interactive Example',
  args: {
    template: 'Explain {{topic}} in simple terms for a {{audience}} audience.',
    inputData:
      '{\n  "topic": "machine learning",\n  "audience": "high school student"\n}',
    model: 'gpt-4o-mini',
    isEmptyState: false,
    hasResults: false,
    metrics: undefined,
    onTemplateChange: (value) => console.log('Template changed:', value),
    onInputDataChange: (value) => console.log('Input data changed:', value),
    onStartWithExample: () => console.log('Start with example clicked'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive panel with console logging for all callbacks.',
      },
    },
  },
};
