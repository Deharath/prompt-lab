import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJobStore } from '../../src/store/jobStore.js';
import { act } from '@testing-library/react';

// Mock listJobs API
vi.mock('../../src/api.js', () => ({
  ApiClient: {
    listJobs: vi
      .fn()
      .mockResolvedValue([{ id: '1', status: 'completed' as const }]),
  },
}));

describe('jobStore', () => {
  beforeEach(() => {
    useJobStore.setState(useJobStore.getInitialState());
  });

  it('has correct initial state', () => {
    const state = useJobStore.getState();
    expect(state.log).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.running).toBe(false);
    expect(state.hasUserData).toBe(false);
    expect(state.comparison).toEqual({});
  });

  it('start sets current job and running', () => {
    const job = {
      id: '1',
      status: 'pending' as const,
      createdAt: new Date('2025-07-03T15:50:08.000Z'),
      provider: 'openai',
      model: 'gpt-4o-mini',
      costUsd: null,
      avgScore: null,
    };
    act(() => useJobStore.getState().start(job));
    const state = useJobStore.getState();
    expect(state.current).toEqual(job);
    expect(state.running).toBe(true);
    expect(state.hasUserData).toBe(true);
    expect(state.log).toEqual([]);
  });

  it('append adds log lines', () => {
    act(() => useJobStore.getState().append('hello'));
    const state = useJobStore.getState();
    expect(state.log.length).toBe(1);
    expect(state.log[0].text).toBe('hello');
  });

  it('finish sets metrics and stops running', () => {
    const metrics = { score: 1 };
    act(() => useJobStore.getState().finish(metrics));
    const state = useJobStore.getState();
    expect(state.metrics).toEqual(metrics);
    expect(state.running).toBe(false);
  });

  it('reset clears current, log, metrics, running', () => {
    act(() => {
      useJobStore.getState().start({
        id: '1',
        status: 'pending' as const,
        createdAt: new Date('2025-07-03T15:50:08.000Z'),
        provider: 'openai',
        model: 'gpt-4o-mini',
        costUsd: null,
        avgScore: null,
      });
      useJobStore.getState().append('log');
      useJobStore.getState().finish({ score: 1 });
      useJobStore.getState().reset();
    });
    const state = useJobStore.getState();
    expect(state.current).toBeUndefined();
    expect(state.log).toEqual([]);
    expect(state.metrics).toBeUndefined();
    expect(state.running).toBe(false);
  });

  it('setUserData updates hasUserData', () => {
    act(() => useJobStore.getState().setUserData(true));
    expect(useJobStore.getState().hasUserData).toBe(true);
  });

  it('comparison actions update comparison state', () => {
    act(() => useJobStore.getState().setBaseJob('base'));
    expect(useJobStore.getState().comparison.baseJobId).toBe('base');
    act(() => useJobStore.getState().setCompareJob('compare'));
    expect(useJobStore.getState().comparison.compareJobId).toBe('compare');
    act(() => useJobStore.getState().clearComparison());
    expect(useJobStore.getState().comparison).toEqual({});
  });

  it('loadHistory loads jobs from API', async () => {
    await act(async () => {
      await useJobStore.getState().loadHistory();
    });
    expect(useJobStore.getState().history.length).toBeGreaterThan(0);
    expect(useJobStore.getState().history[0].id).toBe('1');
  });
});
