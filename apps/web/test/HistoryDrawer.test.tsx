import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HistoryDrawer from '../src/components/HistoryDrawer.js';
import * as jobStoreModule from '../src/store/jobStore.js';
import * as apiModule from '../src/api.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual: Record<string, any> = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HistoryDrawer', () => {
  it('loads history and fetches job on click', async () => {
    const loadHistory = vi.fn();
    const start = vi.fn();
    const append = vi.fn();
    const finish = vi.fn();
    const reset = vi.fn();

    vi.spyOn(jobStoreModule, 'useJobStore').mockReturnValue({
      history: [{ id: 'job1', status: 'completed' }],
      loadHistory,
      start,
      append,
      finish,
      reset,
      setBaseJob: vi.fn(),
      setCompareJob: vi.fn(),
      clearComparison: vi.fn(),
      comparison: {},
    } as unknown as ReturnType<typeof jobStoreModule.useJobStore>);

    vi.spyOn(apiModule, 'fetchJob').mockResolvedValue({
      id: 'job1',
      status: 'completed',
      result: 'hello',
      metrics: { score: 1 },
    });

    render(
      <MemoryRouter>
        <HistoryDrawer open={true} onClose={() => {}} />
      </MemoryRouter>,
    );

    expect(loadHistory).toHaveBeenCalled();

    // Look for the button containing "job1" text - use getAllByText and click the first button
    const job1Buttons = screen.getAllByText((content, element) => {
      return (
        (element?.tagName === 'BUTTON' &&
          element?.textContent?.includes('job1')) ||
        false
      );
    });
    fireEvent.click(job1Buttons[0]);

    await waitFor(() => {
      expect(apiModule.fetchJob).toHaveBeenCalledWith('job1');
    });
  });

  it('selects jobs for comparison and navigates to diff', async () => {
    const loadHistory = vi.fn();
    const setBaseJob = vi.fn();
    const setCompareJob = vi.fn();
    const clearComparison = vi.fn();
    const state: { comparison: { baseJobId?: string; compareJobId?: string } } =
      {
        comparison: {},
      };

    vi.spyOn(jobStoreModule, 'useJobStore').mockReturnValue({
      history: [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'completed' },
      ],
      comparison: state.comparison,
      loadHistory,
      setBaseJob: (id: string) => {
        state.comparison.baseJobId = id;
        setBaseJob(id);
      },
      setCompareJob: (id: string) => {
        state.comparison.compareJobId = id;
        setCompareJob(id);
      },
      clearComparison: () => {
        state.comparison.baseJobId = undefined;
        state.comparison.compareJobId = undefined;
        clearComparison();
      },
      start: vi.fn(),
      append: vi.fn(),
      finish: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof jobStoreModule.useJobStore>);

    render(
      <MemoryRouter>
        <HistoryDrawer open={true} onClose={() => {}} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Compare'));

    // Look for the buttons containing "job1" and "job2" text
    const job1Buttons = screen.getAllByText((content, element) => {
      return (
        (element?.tagName === 'BUTTON' &&
          element?.textContent?.includes('job1')) ||
        false
      );
    });
    fireEvent.click(job1Buttons[0]);
    expect(setBaseJob).toHaveBeenCalledWith('job1');

    const job2Buttons = screen.getAllByText((content, element) => {
      return (
        (element?.tagName === 'BUTTON' &&
          element?.textContent?.includes('job2')) ||
        false
      );
    });
    fireEvent.click(job2Buttons[0]);
    await waitFor(() => {
      expect(setCompareJob).toHaveBeenCalledWith('job2');
      expect(mockNavigate).toHaveBeenCalledWith('/diff');
    });
  });
});
