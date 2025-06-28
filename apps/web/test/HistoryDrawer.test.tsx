import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryDrawer from '../src/components/HistoryDrawer.js';
import * as jobStoreModule from '../src/store/jobStore.js';
import * as apiModule from '../src/api.js';

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
    } as unknown as ReturnType<typeof jobStoreModule.useJobStore>);

    vi.spyOn(apiModule, 'fetchJob').mockResolvedValue({
      id: 'job1',
      status: 'completed',
      result: 'hello',
      metrics: { score: 1 },
    });

    render(<HistoryDrawer open={true} onClose={() => {}} />);

    expect(loadHistory).toHaveBeenCalled();

    fireEvent.click(screen.getByText('job1'));

    await waitFor(() => {
      expect(apiModule.fetchJob).toHaveBeenCalledWith('job1');
    });
  });
});
