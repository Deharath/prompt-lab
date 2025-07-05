import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../src/Home.js';

// Mock the API client
vi.mock('../src/api.js', () => ({
  ApiClient: {
    fetchJobHistory: vi.fn().mockResolvedValue([]),
    streamJob: vi.fn(),
    createJob: vi.fn(),
    fetchJob: vi.fn(),
  },
  listJobs: vi.fn().mockResolvedValue([]),
  fetchJob: vi.fn().mockResolvedValue({}),
}));

// Mock the job store to return a clean state
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
    comparison: { baseJobId: null, compareJobId: null },
    history: [],
    loadHistory: vi.fn(),
  })),
}));

describe('Sticky Layout Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

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
          <div className="bg-background text-foreground min-h-screen w-full max-w-full overflow-x-hidden">
            <Home />
          </div>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('should render sticky two-column layout on desktop', () => {
    renderComponent();

    // Check that the main layout is using flexbox
    const workspace = screen.getByLabelText('Prompt evaluation workspace');
    expect(workspace).toHaveClass('h-full');
    expect(workspace).toHaveClass('flex');
    expect(workspace).toHaveClass('flex-col');
    expect(workspace).toHaveClass('xl:flex-row');
  });

  it('should show sticky run button on desktop', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Check for desktop sticky run button (should be hidden on small screens)
    const desktopRunButton = screen.getByLabelText(/run evaluation/i);
    expect(desktopRunButton).toBeInTheDocument();
  });

  it('should show mobile sticky run button at bottom', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Check for the mobile sticky run button container
    // This should have fixed positioning and be at the bottom
    const mobileButtonContainer = document.querySelector(
      '.fixed.bottom-0.xl\\:hidden',
    );
    expect(mobileButtonContainer).toBeInTheDocument();
  });

  it('should have proper column widths for two-column layout', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Check that left column has proper width classes
    const leftColumn = document.querySelector('.xl\\:w-2\\/5');
    expect(leftColumn).toBeInTheDocument();

    // Check that right column has proper width classes
    const rightColumn = document.querySelector('.xl\\:w-3\\/5');
    expect(rightColumn).toBeInTheDocument();
  });

  it('should make left column scrollable', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Check that left column content is scrollable
    const scrollableContent = document.querySelector(
      '.overflow-y-auto.space-y-4.sm\\:space-y-6.pb-24.xl\\:pb-4',
    );
    expect(scrollableContent).toBeInTheDocument();
  });

  it('should ensure run button is accessible via keyboard', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Find the run button and check it's focusable
    const runButton = screen.getByLabelText(/run evaluation/i);
    expect(runButton).toBeInTheDocument();
    expect(runButton).not.toHaveAttribute('tabindex', '-1');
  });

  it('should maintain proper spacing and layout structure', () => {
    renderComponent();

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Check that the layout has proper gap classes
    const workspace = screen.getByLabelText('Prompt evaluation workspace');
    expect(workspace).toHaveClass('gap-4');
    expect(workspace).toHaveClass('sm:gap-6');
    expect(workspace).toHaveClass('lg:gap-8');
  });
});
