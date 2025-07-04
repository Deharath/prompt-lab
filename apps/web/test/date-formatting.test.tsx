import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import AppSidebar from '../src/components/AppSidebar.js';

// Mock the API module
vi.mock('../src/api.js', () => ({
  fetchJob: vi.fn(),
  listJobs: vi.fn(),
}));

// Mock the job store
vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: () => ({
    start: vi.fn(),
    append: vi.fn(),
    finish: vi.fn(),
    reset: vi.fn(),
    setBaseJob: vi.fn(),
    setCompareJob: vi.fn(),
    clearComparison: vi.fn(),
    comparison: {},
    running: false,
    temperature: 0.7,
    topP: 1,
    maxTokens: 1000,
    selectedMetrics: [],
    setTemperature: vi.fn(),
    setTopP: vi.fn(),
    setMaxTokens: vi.fn(),
    setSelectedMetrics: vi.fn(),
  }),
}));

// Mock ShareRunButton
vi.mock('../src/components/ShareRunButton.js', () => ({
  default: () => <div data-testid="share-button">Share</div>,
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [
      {
        id: 'test-job-123',
        status: 'completed',
        createdAt: new Date('2025-07-03T15:50:08.000Z'),
        provider: 'openai',
        model: 'gpt-4o-mini',
        costUsd: 0.001,
        avgScore: 0.95,
      },
    ],
    isLoading: false,
    error: null,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  }),
}));

describe('AppSidebar Date Formatting', () => {
  it('should display dates in human-readable format using date-fns', () => {
    // ARRANGE: Render the AppSidebar component
    render(
      <MemoryRouter>
        <AppSidebar
          isCollapsed={false}
          onToggle={() => {}}
          onSelectJob={() => {}}
          onCompareJobs={() => {}}
          provider="openai"
          model="gpt-4o-mini"
          onProviderChange={() => {}}
          onModelChange={() => {}}
        />
      </MemoryRouter>,
    );

    // ACT: Find the date display in the rendered component
    const testDate = new Date('2025-07-03T15:50:08.000Z');
    const expectedDateFormat = format(testDate, 'MMM d · HH:mm');

    // ASSERT: Verify the date is displayed in the expected human-readable format
    expect(screen.getByText(expectedDateFormat)).toBeInTheDocument();

    // Additional assertion: verify that date-fns formatting produces a human-readable string
    // The format should match the sidebar's timestamp format: "Jul 3 · 17:50"
    expect(expectedDateFormat).toMatch(/^[A-Za-z]{3} \d{1,2} · \d{2}:\d{2}$/);
  });
});
