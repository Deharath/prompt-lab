import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HistoryDrawer from '../src/components/HistoryDrawer.js';
import DiffPage from '../src/pages/DiffPage.js';
import * as jobStoreModule from '../src/store/jobStore.js';
import { ApiClient } from '../src/api.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Diff workflow', () => {
  it('navigates to diff page and displays deltas', async () => {
    const state: { comparison: { baseJobId?: string; compareJobId?: string } } =
      { comparison: {} };
    const loadHistory = vi.fn();
    const clearComparison = vi.fn();

    vi.spyOn(jobStoreModule, 'useJobStore').mockReturnValue({
      history: [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'completed' },
      ],
      comparison: state.comparison,
      loadHistory,
      start: vi.fn(),
      append: vi.fn(),
      finish: vi.fn(),
      reset: vi.fn(),
      setBaseJob: (id: string) => {
        state.comparison.baseJobId = id;
      },
      setCompareJob: (id: string) => {
        state.comparison.compareJobId = id;
      },
      clearComparison,
    } as unknown as ReturnType<typeof jobStoreModule.useJobStore>);

    vi.spyOn(ApiClient, 'diffJobs').mockResolvedValue({
      baseJob: {
        id: 'job1',
        status: 'completed',
        result: 'hello',
        metrics: { score: 0.5 },
        tokensUsed: 10,
        costUsd: 0.02,
        prompt: '',
        provider: 'openai',
        model: 'gpt',
      },
      compareJob: {
        id: 'job2',
        status: 'completed',
        result: 'hello world',
        metrics: { score: 0.7 },
        tokensUsed: 12,
        costUsd: 0.03,
        prompt: '',
        provider: 'openai',
        model: 'gpt',
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HistoryDrawer open onClose={() => {}} />} />
          <Route path="/diff" element={<DiffPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Compare'));

    // Look for job buttons specifically
    const jobButtons = screen
      .getAllByRole('button')
      .filter(
        (button) =>
          button.textContent?.includes('Job #job1') ||
          button.textContent?.includes('Job #job2'),
      );

    const job1Element = jobButtons.find((button) =>
      button.textContent?.includes('job1'),
    );
    const job2Element = jobButtons.find((button) =>
      button.textContent?.includes('job2'),
    );

    expect(job1Element).toBeTruthy();
    expect(job2Element).toBeTruthy();

    fireEvent.click(job1Element!);
    fireEvent.click(job2Element!);

    await waitFor(() => {
      expect(screen.getByText('Job Comparison')).toBeInTheDocument();
    });

    expect(screen.getAllByText('hello').length).toBeGreaterThan(0);
    expect(screen.getByText('score')).toBeInTheDocument();
    // Look for the specific delta value in the score row
    const scoreRow = screen.getByText('score').closest('tr')!;
    expect(scoreRow).toBeInTheDocument();
    expect(scoreRow.textContent).toContain('0.200');

    // Check the Cost row delta specifically - find the Cost row and check its delta column
    const costRow = screen.getByText('Cost (USD)').closest('tr')!;
    expect(costRow).toBeInTheDocument();
    expect(costRow.textContent).toContain('0.010');

    // Check the Tokens row delta
    const tokensRow = screen.getByText('Tokens Used').closest('tr')!;
    expect(tokensRow).toBeInTheDocument();
    expect(tokensRow.textContent).toContain('2');
  });
});
