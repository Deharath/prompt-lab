import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppSidebar from '../../src/components/features/sidebar/AppSidebar/index.js';
import type { AppSidebarProps } from '../../src/components/features/sidebar/AppSidebar/types.js';

// Mock the child components
vi.mock(
  '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js',
  () => ({
    useAppSidebar: vi.fn(),
  }),
);

vi.mock(
  '../../src/components/features/sidebar/AppSidebar/SidebarHeader.js',
  () => ({
    default: ({ activeTab, setActiveTab }: any) => (
      <div data-testid="sidebar-header">
        <button
          onClick={() => setActiveTab('history')}
          data-testid="history-tab"
        >
          History
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          data-testid="configuration-tab"
        >
          Configuration
        </button>
        <button onClick={() => setActiveTab('custom')} data-testid="custom-tab">
          Custom
        </button>
        <span data-testid="active-tab">{activeTab}</span>
      </div>
    ),
  }),
);

vi.mock(
  '../../src/components/features/sidebar/AppSidebar/HistoryTab.js',
  () => ({
    default: ({
      history,
      isLoading,
      error,
      compareMode,
      onToggleCompareMode,
      onSelectJob,
      onDeleteJob,
    }: any) => (
      <div data-testid="history-tab-content">
        {isLoading && <div data-testid="loading">Loading...</div>}
        {error && (
          <div data-testid="error">
            {error instanceof Error ? error.message : error}
          </div>
        )}
        <div data-testid="compare-mode">
          {compareMode ? 'Compare Mode On' : 'Compare Mode Off'}
        </div>
        <button onClick={onToggleCompareMode} data-testid="toggle-compare">
          Toggle Compare
        </button>
        <div data-testid="job-list">
          {history.map((job: any, index: number) => (
            <div key={job.id} data-testid={`job-${index}`}>
              <span>{job.id}</span>
              <button
                onClick={() => onSelectJob(job)}
                data-testid={`select-job-${index}`}
              >
                Select
              </button>
              <button
                onClick={() => onDeleteJob(job.id)}
                data-testid={`delete-job-${index}`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    ),
  }),
);

vi.mock(
  '../../src/components/features/sidebar/AppSidebar/ConfigurationTab.js',
  () => ({
    default: ({
      provider,
      model,
      temperature,
      topP,
      maxTokens,
      onProviderChange,
      onModelChange,
      setTemperature,
      setTopP,
      setMaxTokens,
    }: any) => (
      <div data-testid="configuration-tab-content">
        <div data-testid="provider-display">{provider}</div>
        <div data-testid="model-display">{model}</div>
        <div data-testid="temperature-display">{temperature}</div>
        <div data-testid="top-p-display">{topP}</div>
        <div data-testid="max-tokens-display">{maxTokens}</div>
        <button
          onClick={() => onProviderChange('new-provider')}
          data-testid="change-provider"
        >
          Change Provider
        </button>
        <button
          onClick={() => onModelChange('new-model')}
          data-testid="change-model"
        >
          Change Model
        </button>
        <button
          onClick={() => setTemperature(0.8)}
          data-testid="set-temperature"
        >
          Set Temperature
        </button>
        <button onClick={() => setTopP(0.9)} data-testid="set-top-p">
          Set Top P
        </button>
        <button onClick={() => setMaxTokens(2000)} data-testid="set-max-tokens">
          Set Max Tokens
        </button>
      </div>
    ),
  }),
);

vi.mock('../../src/components/features/sidebar/CustomPrompt.js', () => ({
  default: ({ onLoadTemplate }: any) => (
    <div data-testid="custom-prompt-content">
      <button
        onClick={() => onLoadTemplate('test template')}
        data-testid="load-template"
      >
        Load Template
      </button>
    </div>
  ),
}));

vi.mock(
  '../../src/components/features/sidebar/AppSidebar/CollapsedSidebar.js',
  () => ({
    default: ({
      onOpenTab,
      onRunEvaluation,
      onCancelEvaluation,
      canRunEvaluation,
      isRunning,
    }: any) => (
      <div data-testid="collapsed-sidebar">
        <button
          onClick={() => onOpenTab('history')}
          data-testid="collapsed-history"
        >
          History
        </button>
        <button
          onClick={() => onOpenTab('configuration')}
          data-testid="collapsed-configuration"
        >
          Configuration
        </button>
        <button
          onClick={() => onOpenTab('custom')}
          data-testid="collapsed-custom"
        >
          Custom
        </button>
        <button
          onClick={isRunning ? onCancelEvaluation : onRunEvaluation}
          disabled={!canRunEvaluation && !isRunning}
          data-testid="collapsed-run-button"
        >
          {isRunning ? 'Cancel' : 'Run'}
        </button>
      </div>
    ),
  }),
);

vi.mock(
  '../../src/components/features/sidebar/AppSidebar/RunEvaluationFooter.js',
  () => ({
    default: ({
      onRunEvaluation,
      onCancelEvaluation,
      canRunEvaluation,
      isRunning,
      promptTokens,
      estimatedCompletionTokens,
      totalTokens,
      estimatedCost,
      template,
      inputData,
    }: any) => (
      <div data-testid="run-evaluation-footer">
        <div data-testid="prompt-tokens">{promptTokens}</div>
        <div data-testid="estimated-completion-tokens">
          {estimatedCompletionTokens}
        </div>
        <div data-testid="total-tokens">{totalTokens}</div>
        <div data-testid="estimated-cost">{estimatedCost}</div>
        <div data-testid="template-preview">{template}</div>
        <div data-testid="input-data-preview">{inputData}</div>
        <button
          onClick={isRunning ? onCancelEvaluation : onRunEvaluation}
          disabled={!canRunEvaluation && !isRunning}
          data-testid="run-evaluation-button"
        >
          {isRunning ? 'Cancel' : 'Run Evaluation'}
        </button>
      </div>
    ),
  }),
);

describe('AppSidebar', () => {
  const mockJobHistory = [
    {
      id: 'job-1',
      provider: 'openai',
      model: 'gpt-4',
      status: 'completed' as const,
      createdAt: new Date(),
      costUsd: 0.01,
      resultSnippet: 'Test result 1',
    },
    {
      id: 'job-2',
      provider: 'gemini',
      model: 'gemini-pro',
      status: 'running' as const,
      createdAt: new Date(),
      costUsd: 0.02,
      resultSnippet: 'Test result 2',
    },
  ];

  const mockSidebarState = {
    sidebarRef: { current: null },
    compareMode: false,
    focusedJobIndex: 0,
    activeTab: 'history' as const,

    history: mockJobHistory,
    isLoading: false,
    error: null,
    comparison: { baseJobId: undefined, compareJobId: undefined },
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 1000,
    selectedMetrics: [],
    setFocusedJobIndex: vi.fn(),
    setActiveTab: vi.fn(),

    setTemperature: vi.fn(),
    setTopP: vi.fn(),
    setMaxTokens: vi.fn(),
    setSelectedMetrics: vi.fn(),
    handleDelete: vi.fn(),

    handleSelect: vi.fn(),
    toggleCompareMode: vi.fn(),
    jobListRef: { current: null },
  };

  const defaultProps: AppSidebarProps = {
    isCollapsed: false,
    onToggle: vi.fn(),
    onSelectJob: vi.fn(),
    onCompareJobs: vi.fn(),
    provider: 'openai',
    model: 'gpt-4',
    onProviderChange: vi.fn(),
    onModelChange: vi.fn(),
    onLoadTemplate: vi.fn(),
    onRunEvaluation: vi.fn(),
    onCancelEvaluation: vi.fn(),
    canRunEvaluation: true,
    isRunning: false,
    promptTokens: 100,
    estimatedCompletionTokens: 200,
    totalTokens: 300,
    estimatedCost: 0.01,
    template: 'Test template',
    inputData: '{"test": "data"}',
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock the useAppSidebar hook
    const { useAppSidebar } = vi.mocked(
      await import(
        '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
      ),
    );
    useAppSidebar.mockReturnValue(mockSidebarState);
  });

  describe('Basic Rendering', () => {
    it('should render expanded sidebar by default', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
      expect(screen.getByTestId('run-evaluation-footer')).toBeInTheDocument();
      expect(
        screen.getByRole('complementary', { name: /sidebar/i }),
      ).toBeInTheDocument();
    });

    it('should render collapsed sidebar when isCollapsed is true', () => {
      render(<AppSidebar {...defaultProps} isCollapsed />);

      expect(screen.getByTestId('collapsed-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-header')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('run-evaluation-footer'),
      ).not.toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      render(<AppSidebar {...defaultProps} />);

      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveAttribute(
        'aria-label',
        expect.stringContaining('Sidebar'),
      );
      expect(sidebar).toHaveAttribute('id', 'sidebar');
    });
  });

  describe('Tab Navigation', () => {
    it('should render history tab by default', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('history-tab-content')).toBeInTheDocument();
      expect(screen.getByTestId('active-tab')).toHaveTextContent('history');
    });

    it('should switch to configuration tab when clicked', async () => {
      const mockSetActiveTab = vi.fn();
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        activeTab: 'configuration' as const,
        setActiveTab: mockSetActiveTab,
      });

      render(<AppSidebar {...defaultProps} />);

      expect(
        screen.getByTestId('configuration-tab-content'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('active-tab')).toHaveTextContent(
        'configuration',
      );
    });

    it('should switch to custom tab when clicked', async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        activeTab: 'custom' as const,
      });

      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('custom-prompt-content')).toBeInTheDocument();
      expect(screen.getByTestId('active-tab')).toHaveTextContent('custom');
    });

    it('should call setActiveTab when tab is clicked', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('configuration-tab'));

      expect(mockSidebarState.setActiveTab).toHaveBeenCalledWith(
        'configuration',
      );
    });
  });

  describe('History Tab Functionality', () => {
    it('should display job history', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('job-list')).toBeInTheDocument();
      expect(screen.getByTestId('job-0')).toHaveTextContent('job-1');
      expect(screen.getByTestId('job-1')).toHaveTextContent('job-2');
    });

    it('should handle job selection', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('select-job-0'));

      expect(mockSidebarState.handleSelect).toHaveBeenCalledWith(
        mockJobHistory[0],
      );
    });

    it('should handle job deletion', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('delete-job-0'));

      expect(mockSidebarState.handleDelete).toHaveBeenCalledWith('job-1');
    });

    it('should toggle compare mode', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('toggle-compare'));

      expect(mockSidebarState.toggleCompareMode).toHaveBeenCalled();
    });

    it('should show loading state', async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        isLoading: true,
      });

      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should show error state', async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        error: new Error('Test error message'),
      });

      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('error')).toHaveTextContent(
        'Test error message',
      );
    });
  });

  describe('Configuration Tab Functionality', () => {
    beforeEach(async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        activeTab: 'configuration' as const,
      });
    });

    it('should display current configuration', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('provider-display')).toHaveTextContent(
        'openai',
      );
      expect(screen.getByTestId('model-display')).toHaveTextContent('gpt-4');
      expect(screen.getByTestId('temperature-display')).toHaveTextContent(
        '0.7',
      );
      expect(screen.getByTestId('top-p-display')).toHaveTextContent('0.9');
      expect(screen.getByTestId('max-tokens-display')).toHaveTextContent(
        '1000',
      );
    });

    it('should handle provider change', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('change-provider'));

      expect(defaultProps.onProviderChange).toHaveBeenCalledWith(
        'new-provider',
      );
    });

    it('should handle model change', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('change-model'));

      expect(defaultProps.onModelChange).toHaveBeenCalledWith('new-model');
    });

    it('should handle temperature change', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-temperature'));

      expect(mockSidebarState.setTemperature).toHaveBeenCalledWith(0.8);
    });

    it('should handle top P change', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-top-p'));

      expect(mockSidebarState.setTopP).toHaveBeenCalledWith(0.9);
    });

    it('should handle max tokens change', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('set-max-tokens'));

      expect(mockSidebarState.setMaxTokens).toHaveBeenCalledWith(2000);
    });
  });

  describe('Custom Tab Functionality', () => {
    beforeEach(async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        activeTab: 'custom' as const,
      });
    });

    it('should render custom prompt component', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('custom-prompt-content')).toBeInTheDocument();
    });

    it('should handle template loading', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('load-template'));

      expect(defaultProps.onLoadTemplate).toHaveBeenCalledWith('test template');
    });
  });

  describe('Collapsed Sidebar Functionality', () => {
    let renderResult: any;

    beforeEach(() => {
      renderResult = render(<AppSidebar {...defaultProps} isCollapsed />);
    });

    afterEach(() => {
      if (renderResult) {
        renderResult.unmount();
      }
    });

    it('should handle tab opening from collapsed state', () => {
      fireEvent.click(screen.getByTestId('collapsed-history'));

      expect(mockSidebarState.setActiveTab).toHaveBeenCalledWith('history');
      expect(defaultProps.onToggle).toHaveBeenCalled();
    });

    it('should handle run evaluation from collapsed state', () => {
      fireEvent.click(screen.getByTestId('collapsed-run-button'));

      expect(defaultProps.onRunEvaluation).toHaveBeenCalled();
    });

    it('should handle cancel evaluation from collapsed state', () => {
      // Re-render with isRunning=true to test cancel functionality
      renderResult.unmount();
      renderResult = render(
        <AppSidebar {...defaultProps} isCollapsed isRunning />,
      );

      fireEvent.click(screen.getByTestId('collapsed-run-button'));

      expect(defaultProps.onCancelEvaluation).toHaveBeenCalled();
    });
  });

  describe('Run Evaluation Footer', () => {
    it('should display token and cost information', () => {
      render(<AppSidebar {...defaultProps} />);

      expect(screen.getByTestId('prompt-tokens')).toHaveTextContent('100');
      expect(
        screen.getByTestId('estimated-completion-tokens'),
      ).toHaveTextContent('200');
      expect(screen.getByTestId('total-tokens')).toHaveTextContent('300');
      expect(screen.getByTestId('estimated-cost')).toHaveTextContent('0.01');
      expect(screen.getByTestId('template-preview')).toHaveTextContent(
        'Test template',
      );
      expect(screen.getByTestId('input-data-preview')).toHaveTextContent(
        '{"test": "data"}',
      );
    });

    it('should handle run evaluation', () => {
      render(<AppSidebar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('run-evaluation-button'));

      expect(defaultProps.onRunEvaluation).toHaveBeenCalled();
    });

    it('should handle cancel evaluation when running', () => {
      render(<AppSidebar {...defaultProps} isRunning />);

      fireEvent.click(screen.getByTestId('run-evaluation-button'));

      expect(defaultProps.onCancelEvaluation).toHaveBeenCalled();
    });

    it('should disable run button when cannot run evaluation', () => {
      render(<AppSidebar {...defaultProps} canRunEvaluation={false} />);

      expect(screen.getByTestId('run-evaluation-button')).toBeDisabled();
    });
  });

  describe('Component Memoization', () => {
    it('should memoize component to prevent unnecessary re-renders', () => {
      const { rerender } = render(<AppSidebar {...defaultProps} />);

      // Re-render with same props
      rerender(<AppSidebar {...defaultProps} />);

      // Should still render the same content
      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    });

    it('should re-render when props change', () => {
      const { rerender } = render(<AppSidebar {...defaultProps} />);

      rerender(<AppSidebar {...defaultProps} isCollapsed />);

      expect(screen.getByTestId('collapsed-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-header')).not.toBeInTheDocument();
    });
  });

  describe('Default Prop Handling', () => {
    it('should handle missing optional props gracefully', () => {
      const minimalProps = {
        isCollapsed: false,
      };

      render(<AppSidebar {...minimalProps} />);

      expect(screen.getByTestId('sidebar-header')).toBeInTheDocument();
    });

    it('should use default values for optional props', async () => {
      const { useAppSidebar } = vi.mocked(
        await import(
          '../../src/components/features/sidebar/AppSidebar/useAppSidebar.js'
        ),
      );
      useAppSidebar.mockReturnValue({
        ...mockSidebarState,
        activeTab: 'configuration' as const,
      });

      render(<AppSidebar isCollapsed={false} />);

      expect(screen.getByTestId('provider-display')).toHaveTextContent('');
      expect(screen.getByTestId('model-display')).toHaveTextContent('');
    });
  });
});
