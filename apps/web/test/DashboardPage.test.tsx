import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardPage from '../src/pages/DashboardPage.js';
import * as api from '../src/api.js';
import { useDashboardStore } from '../src/store/dashboardStore.js';

// Mock the API module
vi.mock('../src/api.js', () => ({
  fetchDashboardStats: vi.fn(),
}));

// Mock Recharts components to avoid ResizeObserver issues
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div />,
}));

const mockDashboardData = {
  scoreHistory: [
    { date: '2024-01-01', avgScore: 0.85 },
    { date: '2024-01-02', avgScore: 0.9 },
    { date: '2024-01-03', avgScore: 0.88 },
  ],
  costByModel: [
    { model: 'gpt-4o-mini', totalCost: 0.025 },
    { model: 'gpt-4', totalCost: 0.15 },
    { model: 'claude-3-sonnet', totalCost: 0.08 },
  ],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the dashboard store state
    const store = useDashboardStore.getState();
    store.isLoading = false;
    store.error = null;
    store.data = null;
    store.days = 30;
  });

  afterEach(() => {
    cleanup();
  });

  it('shows loading indicator initially and renders charts after successful data fetch', async () => {
    // Mock successful API response
    const mockFetchDashboardStats = vi.mocked(api.fetchDashboardStats);
    mockFetchDashboardStats.mockResolvedValue(mockDashboardData);

    render(<DashboardPage />);

    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Wait for data to load and charts to render
    await waitFor(() => {
      expect(screen.getByText('Average Score Over Time')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Cost by Model')).toBeInTheDocument();
    expect(mockFetchDashboardStats).toHaveBeenCalledWith(30);
  });

  it('displays error message when API call fails', async () => {
    // Mock API error
    const mockFetchDashboardStats = vi.mocked(api.fetchDashboardStats);
    mockFetchDashboardStats.mockRejectedValue(
      new Error('Failed to fetch data'),
    );

    render(<DashboardPage />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
  });
});
