import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UnifiedPanel from '../../src/components/features/prompt/UnifiedPanel.js';

// Mock the child components
vi.mock(
  '../../src/components/features/prompt/unified-panel/UnifiedPanelTabs.js',
  () => ({
    UnifiedPanelTabs: ({
      activeTab,
      handleTabChange,
      hasResults,
      isEvaluating,
    }: any) => (
      <div data-testid="unified-panel-tabs">
        <button
          onClick={() => handleTabChange('input')}
          data-testid="input-tab"
          className={activeTab === 'input' ? 'active' : ''}
        >
          Input {isEvaluating && '(Evaluating)'}
        </button>
        <button
          onClick={() => handleTabChange('results')}
          data-testid="results-tab"
          className={activeTab === 'results' ? 'active' : ''}
          disabled={!hasResults}
        >
          Results
        </button>
        <span data-testid="active-tab-indicator">{activeTab}</span>
      </div>
    ),
  }),
);

vi.mock(
  '../../src/components/features/prompt/unified-panel/UnifiedPanelInput.js',
  () => ({
    UnifiedPanelInput: ({
      template,
      inputData,
      onTemplateChange,
      onInputDataChange,
      model,
      onStartWithExample,
      isEmptyState,
    }: any) => (
      <div data-testid="unified-panel-input">
        <input
          data-testid="template-input"
          value={template}
          onChange={(e) => onTemplateChange(e.target.value)}
          placeholder="Template"
        />
        <input
          data-testid="input-data"
          value={inputData}
          onChange={(e) => onInputDataChange(e.target.value)}
          placeholder="Input Data"
        />
        <div data-testid="model-display">{model}</div>
        <button onClick={onStartWithExample} data-testid="start-example-btn">
          Start with Example
        </button>
        {isEmptyState && <div data-testid="empty-state">Empty State</div>}
      </div>
    ),
  }),
);

vi.mock(
  '../../src/components/features/prompt/unified-panel/UnifiedPanelResults.js',
  () => ({
    default: ({ metrics, currentJob }: any) => (
      <div data-testid="unified-panel-results">
        {metrics && (
          <div data-testid="metrics-display">{JSON.stringify(metrics)}</div>
        )}
        {currentJob && <div data-testid="current-job">{currentJob.id}</div>}
      </div>
    ),
  }),
);

// Mock the useJobsData hook
vi.mock('../../src/hooks/useJobsData.js', () => ({
  useJobsData: vi.fn(),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('UnifiedPanel', () => {
  const mockProps = {
    template: 'Test template',
    inputData: '{"key": "value"}',
    onTemplateChange: vi.fn(),
    onInputDataChange: vi.fn(),
    model: 'gpt-4o-mini',
    onStartWithExample: vi.fn(),
    isEmptyState: false,
    metrics: undefined,
    hasResults: false,
    currentJob: undefined,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);

    // Mock useJobsData to return empty history by default
    const { useJobsData } = vi.mocked(
      await import('../../src/hooks/useJobsData.js'),
    );
    useJobsData.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      isError: false,
      isPending: false,
      isSuccess: true,
      status: 'success',
      fetchStatus: 'idle',
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isInitialLoading: false,
      isLoadingError: false,
      isPlaceholderData: false,

      isRefetchError: false,
      isStale: false,
      isPaused: false,
      isEnabled: true,
      promise: Promise.resolve([]),
    });
  });

  describe('Basic Rendering', () => {
    it('should render input tab by default', () => {
      render(<UnifiedPanel {...mockProps} />);

      expect(screen.getByTestId('unified-panel-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('unified-panel-input')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-panel-results'),
      ).not.toBeInTheDocument();
    });

    it('should render with correct container styling', () => {
      render(<UnifiedPanel {...mockProps} />);

      const container = screen.getByTestId('unified-panel-tabs').parentElement;
      expect(container).toHaveClass(
        'bg-card',
        'border-border',
        'overflow-hidden',
        'rounded-xl',
        'border',
        'shadow-sm',
      );
    });

    it('should pass props correctly to UnifiedPanelInput', () => {
      render(<UnifiedPanel {...mockProps} />);

      expect(screen.getByTestId('template-input')).toHaveValue('Test template');
      expect(screen.getByTestId('input-data')).toHaveValue('{"key": "value"}');
      expect(screen.getByTestId('model-display')).toHaveTextContent(
        'gpt-4o-mini',
      );
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to results tab when clicked', () => {
      // Reset mock to ensure no manual selection
      mockSessionStorage.getItem.mockReturnValue(null);

      render(<UnifiedPanel {...mockProps} hasResults />);

      fireEvent.click(screen.getByTestId('results-tab'));

      expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent(
        'results',
      );
      expect(screen.getByTestId('unified-panel-results')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-panel-input'),
      ).not.toBeInTheDocument();
    });

    it('should switch back to input tab when clicked', () => {
      // Mock sessionStorage to simulate manual tab selection
      mockSessionStorage.getItem.mockReturnValue('true');

      render(<UnifiedPanel {...mockProps} hasResults />);

      // Component should start on input tab due to manual selection
      expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent(
        'input',
      );

      // Switch to results first
      fireEvent.click(screen.getByTestId('results-tab'));
      expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent(
        'results',
      );

      // Switch back to input
      fireEvent.click(screen.getByTestId('input-tab'));
      expect(screen.getByTestId('active-tab-indicator')).toHaveTextContent(
        'input',
      );
      expect(screen.getByTestId('unified-panel-input')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-panel-results'),
      ).not.toBeInTheDocument();
    });

    it('should save manual tab selection to sessionStorage', () => {
      render(<UnifiedPanel {...mockProps} hasResults />);

      fireEvent.click(screen.getByTestId('results-tab'));

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'unifiedPanel-manualTab',
        'true',
      );
    });
  });

  describe('Auto-switching to Results', () => {
    it('should auto-switch to results tab when hasResults is true and no manual selection', () => {
      render(<UnifiedPanel {...mockProps} hasResults />);

      expect(screen.getByTestId('unified-panel-results')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-panel-input'),
      ).not.toBeInTheDocument();
    });

    it('should not auto-switch if user has manually selected a tab', () => {
      mockSessionStorage.getItem.mockReturnValue('true');
      render(<UnifiedPanel {...mockProps} hasResults />);

      expect(screen.getByTestId('unified-panel-input')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-panel-results'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Job Evaluation State', () => {
    it('should detect evaluating jobs and pass to tabs', async () => {
      const { useJobsData } = vi.mocked(
        await import('../../src/hooks/useJobsData.js'),
      );
      useJobsData.mockReturnValue({
        data: [
          {
            id: 'job1',
            status: 'evaluating' as const,
            createdAt: new Date(),
            provider: 'openai',
            model: 'gpt-4',
            costUsd: 0.01,
            resultSnippet: 'Test result',
          },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isPending: false,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        isRefetching: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isInitialLoading: false,
        isLoadingError: false,
        isPlaceholderData: false,

        isRefetchError: false,
        isStale: false,
        isPaused: false,
        isEnabled: true,
        promise: Promise.resolve([
          {
            id: 'job1',
            status: 'evaluating' as const,
            createdAt: new Date(),
            provider: 'openai',
            model: 'gpt-4',
            costUsd: 0.01,
            resultSnippet: 'Test result',
          },
        ]),
      });

      render(<UnifiedPanel {...mockProps} />);

      expect(screen.getByTestId('input-tab')).toHaveTextContent(
        'Input (Evaluating)',
      );
    });

    it('should not show evaluating state when no jobs are evaluating', async () => {
      const { useJobsData } = vi.mocked(
        await import('../../src/hooks/useJobsData.js'),
      );
      useJobsData.mockReturnValue({
        data: [
          {
            id: 'job1',
            status: 'completed' as const,
            createdAt: new Date(),
            provider: 'openai',
            model: 'gpt-4',
            costUsd: 0.01,
            resultSnippet: 'Test result',
          },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isError: false,
        isPending: false,
        isSuccess: true,
        status: 'success',
        fetchStatus: 'idle',
        isRefetching: false,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isInitialLoading: false,
        isLoadingError: false,
        isPlaceholderData: false,

        isRefetchError: false,
        isStale: false,
        isPaused: false,
        isEnabled: true,
        promise: Promise.resolve([
          {
            id: 'job1',
            status: 'completed' as const,
            createdAt: new Date(),
            provider: 'openai',
            model: 'gpt-4',
            costUsd: 0.01,
            resultSnippet: 'Test result',
          },
        ]),
      });

      render(<UnifiedPanel {...mockProps} />);

      expect(screen.getByTestId('input-tab')).toHaveTextContent('Input');
    });
  });

  describe('Results Display', () => {
    it('should display metrics in results tab', () => {
      const mockMetrics = { sentiment: 0.8, word_count: 25 };
      render(<UnifiedPanel {...mockProps} hasResults metrics={mockMetrics} />);

      expect(screen.getByTestId('metrics-display')).toHaveTextContent(
        JSON.stringify(mockMetrics),
      );
    });

    it('should display current job in results tab', () => {
      const mockJob = {
        id: 'job-123',
        status: 'completed' as const,
        createdAt: new Date(),
        provider: 'openai',
        model: 'gpt-4',
        costUsd: 0.01,
        resultSnippet: 'Test result',
      };
      render(<UnifiedPanel {...mockProps} hasResults currentJob={mockJob} />);

      expect(screen.getByTestId('current-job')).toHaveTextContent('job-123');
    });
  });

  describe('Input Interactions', () => {
    it('should handle template changes', () => {
      render(<UnifiedPanel {...mockProps} />);

      fireEvent.change(screen.getByTestId('template-input'), {
        target: { value: 'New template' },
      });

      expect(mockProps.onTemplateChange).toHaveBeenCalledWith('New template');
    });

    it('should handle input data changes', () => {
      render(<UnifiedPanel {...mockProps} />);

      fireEvent.change(screen.getByTestId('input-data'), {
        target: { value: '{"new": "data"}' },
      });

      expect(mockProps.onInputDataChange).toHaveBeenCalledWith(
        '{"new": "data"}',
      );
    });

    it('should handle start with example button', () => {
      render(<UnifiedPanel {...mockProps} />);

      fireEvent.click(screen.getByTestId('start-example-btn'));

      expect(mockProps.onStartWithExample).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when isEmptyState is true', () => {
      render(<UnifiedPanel {...mockProps} isEmptyState />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should not show empty state when isEmptyState is false', () => {
      render(<UnifiedPanel {...mockProps} isEmptyState={false} />);

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });
});
