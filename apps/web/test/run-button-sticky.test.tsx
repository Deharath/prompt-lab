import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../src/Home.js';

// Mock the API client
vi.mock('../src/api.js', () => ({
  ApiClient: {
    fetchJobHistory: vi.fn().mockResolvedValue([]),
    streamJob: vi.fn(),
    createJob: vi.fn().mockResolvedValue({ id: 'test-job' }),
    fetchJob: vi.fn().mockResolvedValue({}),
  },
  listJobs: vi.fn().mockResolvedValue([]),
  fetchJob: vi.fn().mockResolvedValue({}),
}));

// Mock the job store
vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: vi.fn(() => ({
    current: null,
    log: [],
    metrics: {},
    running: false,
    hasUserData: false,
    start: vi.fn(),
    finish: vi.fn(),
    reset: vi.fn(),
    setUserData: vi.fn(),
    comparison: {},
    temperature: 0.7,
    topP: 1.0,
    maxTokens: 0,
    selectedMetrics: [],
    setTemperature: vi.fn(),
    setTopP: vi.fn(),
    setMaxTokens: vi.fn(),
    setSelectedMetrics: vi.fn(),
    history: [],
    loadHistory: vi.fn(),
    setBaseJob: vi.fn(),
    setCompareJob: vi.fn(),
    clearComparison: vi.fn(),
  })),
}));

describe('Run Button Sticky Behavior', () => {
  const renderComponent = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
            <Home />
          </div>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('should ensure run button remains visible when content is extremely long', () => {
    renderComponent();

    // Click "Get Started!" to initialize the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Find the prompt textarea
    const promptEditor = screen.getByRole('textbox', {
      name: /prompt template/i,
    });

    // Create an extremely long prompt content (5000+ characters)
    const longText = 'a'.repeat(5000);
    fireEvent.change(promptEditor, { target: { value: longText } });

    // Find the scrolling container in the left column
    const leftColumn = document.querySelector('.xl\\:w-2\\/5') as HTMLElement;
    expect(leftColumn).toBeInTheDocument();

    // Find the element with overflow-y: auto that enables scrolling
    const scrollContainer = document.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();

    // Find the run button container
    const runButtonContainer = document.querySelector(
      '.hidden.xl\\:block.sticky.bottom-6',
    );
    expect(runButtonContainer).toBeInTheDocument();

    // The key test: verify the run button is NOT inside the scrolling container
    // This ensures the button stays visible regardless of scroll position
    const isRunButtonInScrollContainer = scrollContainer?.contains(
      runButtonContainer!,
    );
    expect(isRunButtonInScrollContainer).toBe(false);

    // Additional check: the run button should be a direct child of the left column
    // or at least not contained within the scrollable area
    const isDirectChildOfLeftColumn = leftColumn?.contains(runButtonContainer!);
    expect(isDirectChildOfLeftColumn).toBe(true);
  });
});
