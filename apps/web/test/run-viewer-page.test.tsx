import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import RunViewerPage from '../src/pages/RunViewerPage.js';
import { ApiClient } from '../src/api.js';

// Mock react-router-dom useParams
const mockUseParams = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = (await vi.importActual('react-router-dom')) as any;
  return {
    ...actual,
    useParams: () => mockUseParams(),
  };
});

// Mock the api module
vi.mock('../src/api.js', () => ({
  ApiClient: {
    fetchJob: vi.fn(),
  },
}));

// Get the mocked function
const mockFetchJob = vi.mocked(ApiClient.fetchJob);

// Mock ShareRunButton
vi.mock('../src/components/ShareRunButton.js', () => ({
  default: ({ jobId }: { jobId: string }) => (
    <button data-testid="share-run-button">Share Run {jobId}</button>
  ),
}));

// Mock other UI components
vi.mock('../src/components/ui/Card.js', () => ({
  default: ({ children }: { children: any }) => (
    <div data-testid="card">{children}</div>
  ),
}));

vi.mock('../src/components/ui/Button.js', () => ({
  default: (props: any) => {
    const {
      children,
      onClick,
      fullWidth,
      icon,
      variant,
      size,
      loading,
      ...restProps
    } = props;
    return (
      <button
        onClick={onClick}
        className={fullWidth ? 'w-full' : ''}
        data-variant={variant}
        data-size={size}
        data-loading={loading}
        {...restProps}
      >
        {icon && <span>{icon}</span>}
        {children}
      </button>
    );
  },
}));

vi.mock('../src/components/LoadingSpinner.js', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

vi.mock('../src/components/ErrorMessage.js', () => ({
  default: ({ message }: { message: string }) => (
    <div data-testid="error-message">{message}</div>
  ),
}));

const mockJobData = {
  id: 'test-job-123',
  status: 'completed' as const,
  provider: 'openai',
  model: 'gpt-4o-mini',
  prompt: 'Test prompt for evaluation',
  result: 'This is the evaluation result',
  metrics: {
    totalTokens: 175,
    avgCosSim: 0.85,
    meanLatencyMs: 120,
    costUsd: 0.002,
  },
  tokensUsed: 150,
  costUsd: 0.003,
  createdAt: new Date('2025-07-03T15:50:08.000Z'),
  updatedAt: new Date('2025-07-03T15:51:08.000Z'),
};

describe('RunViewerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document title
    document.title = '';
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithRouter = (ui: any) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it('displays loading spinner while fetching job', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<RunViewerPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error message when job is not found', async () => {
    mockUseParams.mockReturnValue({ id: 'nonexistent-job' });
    mockFetchJob.mockRejectedValueOnce(new Error('Job not found'));

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Run not found')).toBeInTheDocument();
    });

    // Should show back to home button
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('displays error when job ID is missing', async () => {
    mockUseParams.mockReturnValue({ id: undefined });

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Use getAllByTestId and check the specific error message
      const errorMessages = screen.getAllByTestId('error-message');
      const jobIdMissingError = errorMessages.find(
        (el) => el.textContent === 'Job ID is missing',
      );
      expect(jobIdMissingError).toBeInTheDocument();
      expect(screen.getByText('Job ID is missing')).toBeInTheDocument();
    });
  });

  it('successfully loads and displays job data', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Check that loading is complete and content is displayed - should be only one instance
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

      // Check job header information
      expect(screen.getByText('Run Viewer')).toBeInTheDocument();
      expect(screen.getByText('Run #test-job')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();

      // Use getAllByText for elements that appear multiple times
      const openaiElements = screen.getAllByText('openai');
      expect(openaiElements.length).toBeGreaterThan(0);

      const modelElements = screen.getAllByText('gpt-4o-mini');
      expect(modelElements.length).toBeGreaterThan(0);

      // Check prompt section
      expect(screen.getByText('Prompt')).toBeInTheDocument();
      expect(
        screen.getByText('Test prompt for evaluation'),
      ).toBeInTheDocument();

      // Check output section
      expect(screen.getByText('Output')).toBeInTheDocument();
      expect(
        screen.getByText('This is the evaluation result'),
      ).toBeInTheDocument();

      // Check share buttons are present
      const shareButtons = screen.getAllByTestId('share-run-button');
      expect(shareButtons).toHaveLength(2); // One in header, one in results
    });
  });

  it('sets correct page title with job prompt', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      expect(document.title).toBe('Run · Test prompt for evaluation');
    });
  });

  it('truncates long prompts in page title', async () => {
    const longPromptJob = {
      ...mockJobData,
      prompt:
        'This is a very long prompt that should be truncated when used in the page title because it exceeds the maximum character limit',
    };

    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(longPromptJob);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      expect(document.title).toBe(
        'Run · This is a very long prompt that should be trunca…',
      );
    });
  });

  it('displays metrics when available', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Use getAllByText to handle multiple "Metrics" headings
      const metricsHeadings = screen.getAllByText('Metrics');
      expect(metricsHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText('175.000')).toBeInTheDocument(); // totalTokens (formatted)
      expect(screen.getByText('0.850')).toBeInTheDocument(); // avgCosSim
      expect(screen.getByText('120.000')).toBeInTheDocument(); // meanLatencyMs (formatted)
    });
  });

  it('displays usage information when available', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Use getAllByText to handle multiple "Usage" headings
      const usageHeadings = screen.getAllByText('Usage');
      expect(usageHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText('150')).toBeInTheDocument(); // tokensUsed (localeString)
      expect(screen.getByText('$0.0030')).toBeInTheDocument(); // costUsd (formatted)
    });
  });

  it('disables all controls in read-only mode', async () => {
    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Check that the prompt textarea is disabled - use getAllByText to handle duplicates
      const promptElements = screen.getAllByText('Test prompt for evaluation');
      expect(promptElements.length).toBeGreaterThan(0);
      // Check the first (or any) prompt element for disabled state
      expect(promptElements[0]).toHaveAttribute('aria-disabled', 'true');

      // Check that provider and model selectors are disabled
      const selects = screen.getAllByRole('combobox');
      selects.forEach((select) => {
        expect(select).toBeDisabled();
      });

      // Check that all run buttons are disabled - use getAllByText to handle multiple buttons
      const runButtons = screen.getAllByText('Run Evaluation (Read-Only)');
      expect(runButtons.length).toBeGreaterThan(0);
      runButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  it('scrolls to top on mount', async () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      value: scrollToMock,
      writable: true,
    });

    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    expect(scrollToMock).toHaveBeenCalledWith(0, 0);
  });

  it('handles dark mode correctly', async () => {
    // Mock localStorage to return dark mode preference
    (window.localStorage.getItem as any).mockReturnValue(JSON.stringify(true));

    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(mockJobData);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      // Check that dark mode class is applied
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('sets fallback page title when prompt is empty', async () => {
    const jobWithoutPrompt = {
      ...mockJobData,
      prompt: '',
    };

    mockUseParams.mockReturnValue({ id: 'test-job-123' });
    mockFetchJob.mockResolvedValueOnce(jobWithoutPrompt);

    renderWithRouter(<RunViewerPage />);

    await waitFor(() => {
      expect(document.title).toBe('Run · test-job-123');
    });
  });
});
