import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/api.js';

describe('API Timestamp Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse createdAt field from job response as Date object', async () => {
    // ARRANGE: Mock fetch to return a job with ISO 8601 createdAt string
    const mockJobResponse = {
      id: 'test-job-123',
      status: 'completed',
      createdAt: '2025-07-03T15:50:08.000Z',
      updatedAt: '2025-07-03T15:51:08.000Z',
      result: 'Test result',
      metrics: { score: 0.95 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJobResponse,
    }) as unknown as typeof fetch;

    // ACT: Fetch the job via API client
    const result = await ApiClient.fetchJob('test-job-123');

    // ASSERT: Verify the createdAt field is parsed as a Date object
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe('2025-07-03T15:50:08.000Z');
    expect(result.updatedAt.toISOString()).toBe('2025-07-03T15:51:08.000Z');
  });

  it('should parse createdAt field from job list response as Date objects', async () => {
    // ARRANGE: Mock fetch to return job list with ISO 8601 createdAt strings
    const mockJobsResponse = [
      {
        id: 'job-1',
        status: 'completed',
        createdAt: '2025-07-03T15:50:08.000Z',
        provider: 'openai',
        model: 'gpt-4o-mini',
        costUsd: 0.001,
        avgScore: 0.95,
      },
      {
        id: 'job-2',
        status: 'pending',
        createdAt: '2025-07-03T16:50:08.000Z',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        costUsd: null,
        avgScore: null,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockJobsResponse,
    }) as unknown as typeof fetch;

    // ACT: Fetch job list via API client
    const result = await ApiClient.listJobs();

    // ASSERT: Verify all createdAt fields are parsed as Date objects
    expect(result).toHaveLength(2);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[1].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2025-07-03T15:50:08.000Z');
    expect(result[1].createdAt.toISOString()).toBe('2025-07-03T16:50:08.000Z');
  });
});
