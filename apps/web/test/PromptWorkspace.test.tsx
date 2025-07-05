/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PromptWorkspace from '../src/components/PromptWorkspace.js';

// Mock the job store
const mockJobStore = {
  log: [],
  metrics: {},
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1000,
  selectedMetrics: [],
};

// Mock the job streaming hook
const mockJobStreaming = {
  outputText: '',
  streamStatus: 'complete' as 'streaming' | 'complete' | 'error',
  isExecuting: false,
  executeJob: vi.fn(),
};

// Mock the token counter utilities
const mockTokenCounter = {
  countTokens: vi.fn().mockReturnValue(100),
  estimateCompletionTokens: vi.fn().mockReturnValue(200),
  estimateCost: vi.fn().mockReturnValue(0.005),
};

vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: () => mockJobStore,
}));

vi.mock('../src/hooks/useJobStreaming.js', () => ({
  useJobStreaming: () => mockJobStreaming,
}));

vi.mock('../src/utils/tokenCounter.js', () => mockTokenCounter);

vi.mock('../src/components/UnifiedPanel.js', () => ({
  default: ({
    template,
    inputData,
    onTemplateChange,
    onInputDataChange,
  }: any) => (
    <div data-testid="unified-panel">
      <input
        data-testid="template-input"
        value={template}
        onChange={(e) => onTemplateChange(e.target.value)}
        placeholder="Template"
      />
      <input
        data-testid="input-data-input"
        value={inputData}
        onChange={(e) => onInputDataChange(e.target.value)}
        placeholder="Input Data"
      />
    </div>
  ),
}));

vi.mock('../src/components/ModernLiveOutput.js', () => ({
  default: ({ outputText, status }: any) => (
    <div data-testid="live-output">
      <div data-testid="output-text">{outputText}</div>
      <div data-testid="status">{status}</div>
    </div>
  ),
}));

const defaultProps = {
  onStateChange: vi.fn(),
};

const renderPromptWorkspace = (props = {}) => {
  return render(
    <MemoryRouter>
      <PromptWorkspace {...defaultProps} {...props} />
    </MemoryRouter>,
  );
};

describe('PromptWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the unified panel and output area', () => {
    renderPromptWorkspace();

    expect(screen.getByTestId('unified-panel')).toBeInTheDocument();
    expect(screen.getByTestId('template-input')).toBeInTheDocument();
    expect(screen.getByTestId('input-data-input')).toBeInTheDocument();
  });

  it('should show "Ready to stream" when no output is available', () => {
    renderPromptWorkspace();

    expect(screen.getByText('Ready to stream')).toBeInTheDocument();
  });

  it('should show live output when there is output text', () => {
    mockJobStreaming.outputText = 'Test output';
    mockJobStreaming.streamStatus = 'streaming';

    renderPromptWorkspace();

    expect(screen.getByTestId('live-output')).toBeInTheDocument();
    expect(screen.getByTestId('output-text')).toHaveTextContent('Test output');
    expect(screen.getByTestId('status')).toHaveTextContent('streaming');
  });

  it('should show live output when streaming is in progress', () => {
    mockJobStreaming.outputText = '';
    mockJobStreaming.streamStatus = 'streaming';

    renderPromptWorkspace();

    expect(screen.getByTestId('live-output')).toBeInTheDocument();
    expect(screen.getByTestId('status')).toHaveTextContent('streaming');
  });

  it('should call onTemplateChange when template input changes', () => {
    const onTemplateChange = vi.fn();
    renderPromptWorkspace({ onTemplateChange });

    const templateInput = screen.getByTestId(
      'template-input',
    ) as HTMLInputElement;
    fireEvent.change(templateInput, { target: { value: 'New template' } });

    expect(onTemplateChange).toHaveBeenCalledWith('New template');
  });

  it('should call onInputDataChange when input data changes', () => {
    const onInputDataChange = vi.fn();
    renderPromptWorkspace({ onInputDataChange });

    const inputDataInput = screen.getByTestId(
      'input-data-input',
    ) as HTMLInputElement;
    fireEvent.change(inputDataInput, { target: { value: 'New input data' } });

    expect(onInputDataChange).toHaveBeenCalledWith('New input data');
  });

  it('should calculate token counts correctly when template and input are provided', () => {
    const template = 'Process this: {{input}}';
    const inputData = 'test data';

    renderPromptWorkspace({ template, inputData });

    expect(mockTokenCounter.countTokens).toHaveBeenCalledWith(
      'Process this: test data',
      'gpt-4',
    );
    expect(mockTokenCounter.estimateCompletionTokens).toHaveBeenCalledWith(
      'Process this: test data',
      'gpt-4',
    );
    expect(mockTokenCounter.estimateCost).toHaveBeenCalledWith(
      100,
      200,
      'gpt-4',
    );
  });

  it('should pass correct props to UnifiedPanel', () => {
    const props = {
      template: 'Test template',
      inputData: 'Test input',
      model: 'gpt-3.5-turbo',
      onTemplateChange: vi.fn(),
      onInputDataChange: vi.fn(),
      onStartWithExample: vi.fn(),
      isEmptyState: false,
    };

    renderPromptWorkspace(props);

    expect(screen.getByDisplayValue('Test template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test input')).toBeInTheDocument();
  });

  it('should handle empty state correctly', () => {
    renderPromptWorkspace({ isEmptyState: true });

    // The component should still render but with empty state
    expect(screen.getByTestId('unified-panel')).toBeInTheDocument();
    expect(screen.getByText('Ready to stream')).toBeInTheDocument();
  });

  afterEach(() => {
    // Reset mock values after each test
    mockJobStreaming.outputText = '';
    mockJobStreaming.streamStatus = 'complete';
    mockJobStreaming.isExecuting = false;
  });
});
