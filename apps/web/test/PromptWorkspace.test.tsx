/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PromptWorkspace from '../src/components/PromptWorkspace.js';

// Mock stores and hooks
const mockJobStore = {
  log: [],
  metrics: {},
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1000,
  selectedMetrics: [],
  hasUserData: false,
  setUserData: vi.fn(),
};

const mockWorkspaceStore = {
  template: '',
  inputData: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  setTemplate: vi.fn(),
  setInputData: vi.fn(),
  setProvider: vi.fn(),
  setModel: vi.fn(),
  startWithExample: vi.fn(),
  loadJobData: vi.fn(),
};

const mockJobStreaming = {
  outputText: '',
  streamStatus: 'complete' as 'streaming' | 'complete' | 'error',
  isExecuting: false,
  executeJob: vi.fn(),
  error: null as string | null,
};

vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: () => mockJobStore,
}));

vi.mock('../src/store/workspaceStore.js', () => ({
  useWorkspaceStore: vi.fn(() => mockWorkspaceStore),
}));

vi.mock('../src/hooks/useJobStreaming.js', () => ({
  useJobStreaming: () => mockJobStreaming,
}));

// Mock components
vi.mock('../src/components/UnifiedPanel.js', () => ({
  default: ({ template, inputData, isEmptyState }: any) => (
    <div data-testid="unified-panel">
      <input data-testid="template-input" value={template} readOnly />
      <input data-testid="input-data-input" value={inputData} readOnly />
      {isEmptyState && <div data-testid="empty-state">Empty state</div>}
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

vi.mock('../src/components/ui/ErrorAlert.js', () => ({
  default: ({ error }: any) => <div data-testid="error-alert">{error}</div>,
}));

const renderPromptWorkspace = (props = {}) => {
  return render(
    <MemoryRouter>
      <PromptWorkspace onJobSelect={vi.fn()} {...props} />
    </MemoryRouter>,
  );
};

describe('PromptWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkspaceStore.template = '';
    mockWorkspaceStore.inputData = '';
    mockJobStore.log = [];
    mockJobStreaming.outputText = '';
    mockJobStreaming.streamStatus = 'complete';
    mockJobStreaming.error = null;
  });

  it('should render correctly', () => {
    renderPromptWorkspace();
    expect(screen.getByTestId('unified-panel')).toBeInTheDocument();
  });

  it('should show Ready to stream when no output', () => {
    renderPromptWorkspace();
    expect(screen.getByText('Ready to stream')).toBeInTheDocument();
  });

  it('should show live output when streaming', () => {
    mockJobStreaming.outputText = 'Test output';
    mockJobStreaming.streamStatus = 'streaming';
    renderPromptWorkspace();
    expect(screen.getByTestId('live-output')).toBeInTheDocument();
  });

  it('should display error when present', () => {
    mockJobStreaming.error = 'Test error';
    renderPromptWorkspace();
    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
  });
});
