import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import { MemoryRouter } from 'react-router-dom';
import HistorySidebar from '../src/components/AppSidebar.js';

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
}));

describe('HistorySidebar Date Formatting', () => {
  it('should display dates in human-readable format using date-fns', () => {
    // ARRANGE: Render the HistorySidebar component
    render(
      <MemoryRouter>
        <HistorySidebar
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
    const expectedDateFormat = format(testDate, 'MMM d, yyyy, h:mm:ss a');

    // ASSERT: Verify the date is displayed in the expected human-readable format
    expect(screen.getByText(expectedDateFormat)).toBeInTheDocument();

    // Additional assertion: verify that date-fns formatting produces a human-readable string
    // The exact time will vary by timezone, but format should include month, day, year, and time
    expect(expectedDateFormat).toMatch(
      /^[A-Za-z]{3} \d{1,2}, \d{4}, \d{1,2}:\d{2}:\d{2} [AP]M$/,
    );
  });
});
