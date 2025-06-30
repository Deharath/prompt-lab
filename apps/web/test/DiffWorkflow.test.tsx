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
    fireEvent.click(screen.getByText('job1'));
    fireEvent.click(screen.getByText('job2'));

    await waitFor(() => {
      expect(screen.getByText('Job Diff')).toBeInTheDocument();
    });

    expect(screen.getAllByText('hello').length).toBeGreaterThan(0);
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByText('0.200')).toBeInTheDocument();
    expect(screen.getByText('0.010')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
