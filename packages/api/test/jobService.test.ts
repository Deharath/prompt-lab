import { describe, it, beforeEach, expect, vi } from 'vitest';
import type { JobMetrics } from '@prompt-lab/api';

let createJob: typeof import('@prompt-lab/api').createJob;
let getJob: typeof import('@prompt-lab/api').getJob;
let updateJob: typeof import('@prompt-lab/api').updateJob;
let log: typeof import('@prompt-lab/api').log;

beforeEach(async () => {
  vi.resetModules();
  process.env.DATABASE_URL = ':memory:';
  process.env.NODE_ENV = 'test';
  const api = await import('@prompt-lab/api');
  createJob = api.createJob;
  getJob = api.getJob;
  updateJob = api.updateJob;
  log = api.log;
  // silence logging during tests
  vi.spyOn(log, 'jobCreated').mockImplementation(() => {});
  vi.spyOn(log, 'jobStarted').mockImplementation(() => {});
  vi.spyOn(log, 'jobCompleted').mockImplementation(() => {});
  vi.spyOn(log, 'jobFailed').mockImplementation(() => {});
});

function sampleMetrics(): JobMetrics {
  return {
    totalTokens: 10,
    avgCosSim: 0.9,
    meanLatencyMs: 100,
    costUSD: 0.05,
    evaluationCases: 2,
    startTime: 0,
    endTime: 10,
  };
}

describe('job service', () => {
  it('creates and retrieves a job', async () => {
    const job = await createJob({
      prompt: 'hi',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    expect(job.id).toBeDefined();
    expect(job.status).toBe('pending');

    const fetched = await getJob(job.id);
    expect(fetched).toEqual(job);
  });

  it('updates job status and metrics', async () => {
    const job = await createJob({
      prompt: 'test',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
    const metrics = sampleMetrics();
    const expectedAvg =
      Object.values(metrics).reduce((a, b) => a + (b as number), 0) /
      Object.values(metrics).length;
    const updated = await updateJob(job.id, {
      status: 'completed',
      result: 'done',
      metrics,
    });

    expect(updated.status).toBe('completed');
    expect(updated.result).toBe('done');
    expect(typeof updated.metrics).toBe('object');
    expect(updated.metrics?.avgScore).toBeCloseTo(expectedAvg);
    expect(updated.tokensUsed).toBe(metrics.totalTokens);
    expect(updated.costUsd).toBeCloseTo(metrics.costUSD);

    const storedMetrics = updated.metrics as JobMetrics & { avgScore: number };
    expect(storedMetrics.avgScore).toBeCloseTo(expectedAvg);

    const fetched = await getJob(job.id);
    expect(fetched?.status).toBe('completed');
    expect(typeof fetched?.metrics).toBe('object');
    expect((fetched?.metrics as any).avgScore).toBeCloseTo(expectedAvg);
    expect(fetched?.tokensUsed).toBe(metrics.totalTokens);
    expect(fetched?.costUsd).toBeCloseTo(metrics.costUSD);
  });
});
