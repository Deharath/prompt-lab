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
    totalTokens: 1,
    avgCosSim: 0.9,
    meanLatencyMs: 100,
    costUSD: 0.001,
    evaluationCases: 1,
    startTime: Date.now(),
    endTime: Date.now(),
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
    const updated = await updateJob(job.id, {
      status: 'completed',
      result: 'done',
      metrics,
    });

    expect(updated.status).toBe('completed');
    expect(updated.result).toBe('done');
    expect(typeof updated.metrics).toBe('object');
    expect(updated.metrics).toEqual(metrics);

    const fetched = await getJob(job.id);
    expect(fetched?.status).toBe('completed');
    expect(typeof fetched?.metrics).toBe('object');
    expect(fetched?.metrics).toEqual(metrics);
  });
});
