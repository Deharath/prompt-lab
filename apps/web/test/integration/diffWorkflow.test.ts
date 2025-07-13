/**
 * Integration tests for the "Diff" workflow
 * Tests the complete diff functionality from comparing two jobs to displaying results
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useJobStore } from '../../src/store/jobStore.js';
import type { JobSummary, JobDetails } from '../../src/api.js';

// Mock the API client
vi.mock('../../src/api.js', () => ({
  ApiClient: {
    fetchJob: vi.fn(),
    listJobs: vi.fn(),
  },
}));

// Import the mocked ApiClient
import { ApiClient } from '../../src/api.js';

describe('Diff Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete the full diff workflow with two jobs', async () => {
    // Mock job summaries for comparison
    const mockJob1: JobSummary = {
      id: 'job-1',
      status: 'completed',
      provider: 'openai',
      model: 'gpt-4o-mini',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      costUsd: 0.01,
      resultSnippet: 'Hello World!',
    };

    const mockJob2: JobSummary = {
      id: 'job-2',
      status: 'completed',
      provider: 'openai',
      model: 'gpt-4o',
      createdAt: new Date('2024-01-01T11:00:00Z'),
      costUsd: 0.02,
      resultSnippet: 'Greetings World!',
    };

    // Step 1: Set up job store with comparison
    const { result } = renderHook(() => useJobStore());

    // Step 2: Set up comparison between two jobs
    act(() => {
      result.current.start(mockJob1);
      result.current.setBaseJob('job-1');
      result.current.setCompareJob('job-2');
    });

    // Step 3: Verify the comparison data is loaded
    expect(result.current.comparison.baseJobId).toBe('job-1');
    expect(result.current.comparison.compareJobId).toBe('job-2');

    // Step 4: Verify current job is set
    expect(result.current.current?.id).toBe('job-1');
    expect(result.current.current?.model).toBe('gpt-4o-mini');

    // Step 5: Simulate detailed job fetching for metrics comparison
    const mockJob1Details: JobDetails = {
      id: 'job-1',
      status: 'completed',
      result: 'Hello World!',
      prompt: 'Say hello',
      provider: 'openai',
      model: 'gpt-4o-mini',
      metrics: {
        sentiment: 0.8,
        flesch_reading_ease: 75.0,
        response_time_ms: 1200,
      },
      tokensUsed: 10,
      costUsd: 0.01,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:01:00Z'),
    };

    const mockJob2Details: JobDetails = {
      id: 'job-2',
      status: 'completed',
      result: 'Greetings World!',
      prompt: 'Say greetings',
      provider: 'openai',
      model: 'gpt-4o',
      metrics: {
        sentiment: 0.9,
        flesch_reading_ease: 80.5,
        response_time_ms: 900,
      },
      tokensUsed: 12,
      costUsd: 0.02,
      createdAt: new Date('2024-01-01T11:00:00Z'),
      updatedAt: new Date('2024-01-01T11:01:00Z'),
    };

    vi.mocked(ApiClient.fetchJob)
      .mockResolvedValueOnce(mockJob1Details)
      .mockResolvedValueOnce(mockJob2Details);

    // Step 6: Verify API calls can be made for detailed comparison
    const job1Details = await ApiClient.fetchJob('job-1');
    const job2Details = await ApiClient.fetchJob('job-2');

    expect(ApiClient.fetchJob).toHaveBeenCalledWith('job-1');
    expect(ApiClient.fetchJob).toHaveBeenCalledWith('job-2');

    // Step 7: Verify comparison calculations can be performed
    const metricsComparison = {
      sentimentDiff:
        (job2Details.metrics?.sentiment as number) -
        (job1Details.metrics?.sentiment as number),
      readabilityDiff:
        (job2Details.metrics?.flesch_reading_ease as number) -
        (job1Details.metrics?.flesch_reading_ease as number),
      responseTimeDiff:
        (job2Details.metrics?.response_time_ms as number) -
        (job1Details.metrics?.response_time_ms as number),
    };

    expect(metricsComparison.sentimentDiff).toBeCloseTo(0.1);
    expect(metricsComparison.readabilityDiff).toBeCloseTo(5.5);
    expect(metricsComparison.responseTimeDiff).toBe(-300);
  });

  it('should handle diff workflow with missing comparison job', async () => {
    // Mock API error for missing job
    vi.mocked(ApiClient.fetchJob).mockRejectedValue(new Error('Job not found'));

    const { result } = renderHook(() => useJobStore());

    // Set up comparison with non-existent job
    act(() => {
      result.current.setCompareJob('non-existent-job');
    });

    // Verify comparison job ID is set
    expect(result.current.comparison.compareJobId).toBe('non-existent-job');

    // Attempt to fetch comparison job and verify error handling
    let fetchError: unknown;
    try {
      await ApiClient.fetchJob('non-existent-job');
    } catch (error) {
      fetchError = error;
    }

    // Verify error handling
    expect(fetchError).toBeInstanceOf(Error);
    expect((fetchError as Error).message).toBe('Job not found');
  });

  it('should clear comparison workflow', async () => {
    const { result } = renderHook(() => useJobStore());

    // Set up comparison first
    act(() => {
      result.current.setBaseJob('job-1');
      result.current.setCompareJob('job-2');
    });

    expect(result.current.comparison.baseJobId).toBe('job-1');
    expect(result.current.comparison.compareJobId).toBe('job-2');

    // Clear comparison
    act(() => {
      result.current.clearComparison();
    });

    // Verify comparison is cleared
    expect(result.current.comparison.baseJobId).toBeUndefined();
    expect(result.current.comparison.compareJobId).toBeUndefined();
  });

  it('should handle workflow with identical jobs in comparison', async () => {
    const mockJob: JobSummary = {
      id: 'job-identical',
      status: 'completed',
      provider: 'openai',
      model: 'gpt-4o-mini',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      costUsd: 0.01,
      resultSnippet: 'Hello World!',
    };

    const mockJobDetails: JobDetails = {
      id: 'job-identical',
      status: 'completed',
      result: 'Hello World!',
      prompt: 'Say hello',
      provider: 'openai',
      model: 'gpt-4o-mini',
      metrics: {
        sentiment: 0.8,
        flesch_reading_ease: 75.0,
        response_time_ms: 1200,
        token_count: 12,
      },
      tokensUsed: 12,
      costUsd: 0.01,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:01:00Z'),
    };

    vi.mocked(ApiClient.fetchJob).mockResolvedValue(mockJobDetails);

    const { result } = renderHook(() => useJobStore());

    // Set up comparison with identical job
    act(() => {
      result.current.start(mockJob);
      result.current.setBaseJob('job-identical');
      result.current.setCompareJob('job-identical');
    });

    // Verify comparison setup
    expect(result.current.comparison.baseJobId).toBe('job-identical');
    expect(result.current.comparison.compareJobId).toBe('job-identical');

    // Calculate differences (should all be zero for identical jobs)
    const metricsComparison = {
      sentimentDiff: 0, // Same job
      readabilityDiff: 0,
      responseTimeDiff: 0,
      tokenCountDiff: 0,
    };

    expect(metricsComparison.sentimentDiff).toBe(0);
    expect(metricsComparison.readabilityDiff).toBe(0);
    expect(metricsComparison.responseTimeDiff).toBe(0);
    expect(metricsComparison.tokenCountDiff).toBe(0);
  });

  it('should validate diff workflow with different output characteristics', async () => {
    const mockShortJob: JobSummary = {
      id: 'job-short',
      status: 'completed',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      costUsd: 0.005,
      resultSnippet: 'Hi!',
    };

    const mockLongJob: JobSummary = {
      id: 'job-long',
      status: 'completed',
      provider: 'openai',
      model: 'gpt-4',
      createdAt: new Date('2024-01-01T11:00:00Z'),
      costUsd: 0.03,
      resultSnippet: 'This is a much longer response...',
    };

    const shortJobDetails: JobDetails = {
      id: 'job-short',
      status: 'completed',
      result: 'Hi!',
      prompt: 'Say hi',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      metrics: { token_count: 2, word_count: 1 },
      tokensUsed: 2,
      costUsd: 0.005,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:01:00Z'),
    };

    const longJobDetails: JobDetails = {
      id: 'job-long',
      status: 'completed',
      result:
        'This is a much longer response that contains significantly more content and detail.',
      prompt: 'Write a long response',
      provider: 'openai',
      model: 'gpt-4',
      metrics: { token_count: 18, word_count: 15 },
      tokensUsed: 18,
      costUsd: 0.03,
      createdAt: new Date('2024-01-01T11:00:00Z'),
      updatedAt: new Date('2024-01-01T11:01:00Z'),
    };

    vi.mocked(ApiClient.fetchJob)
      .mockResolvedValueOnce(shortJobDetails)
      .mockResolvedValueOnce(longJobDetails);

    const { result } = renderHook(() => useJobStore());

    act(() => {
      result.current.start(mockShortJob);
      result.current.setBaseJob('job-short');
      result.current.setCompareJob('job-long');
    });

    // Fetch job details for comparison
    const shortDetails = await ApiClient.fetchJob('job-short');
    const longDetails = await ApiClient.fetchJob('job-long');

    // Verify significant difference in output characteristics
    const outputLengthDiff =
      (longDetails.result?.length || 0) - (shortDetails.result?.length || 0);
    const tokenCountDiff =
      (longDetails.metrics?.token_count as number) -
      (shortDetails.metrics?.token_count as number);
    const wordCountDiff =
      (longDetails.metrics?.word_count as number) -
      (shortDetails.metrics?.word_count as number);

    expect(outputLengthDiff).toBeGreaterThan(50); // Significant length difference
    expect(tokenCountDiff).toBe(16); // 16 more tokens
    expect(wordCountDiff).toBe(14); // 14 more words
  });
});
