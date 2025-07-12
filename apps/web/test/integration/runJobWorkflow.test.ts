/**
 * Integration tests for the "Run Job" workflow
 * Tests the complete workflow logic from job creation to completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useWorkspaceStore } from '../../src/store/workspaceStore.js';
import { useJobStore } from '../../src/store/jobStore.js';
import { useJobStreaming } from '../../src/hooks/useJobStreaming.js';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import type { JobSummary, JobDetails } from '../../src/api.js';

// Mock the API client
vi.mock('../../src/api.js', () => ({
  ApiClient: {
    createJob: vi.fn(),
    streamJob: vi.fn(),
    fetchJob: vi.fn(),
  },
}));

// Import the mocked ApiClient
import { ApiClient } from '../../src/api.js';

// Create a wrapper component with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

// Mock EventSource for SSE streaming
class MockEventSource {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onopen: ((event: any) => void) | null = null;
  readyState = 1; // OPEN

  constructor(public url: string) {}

  close() {
    this.readyState = 2; // CLOSED
  }

  addEventListener(event: string, handler: (event: any) => void) {
    if (event === 'message') this.onmessage = handler;
    if (event === 'error') this.onerror = handler;
    if (event === 'open') this.onopen = handler;
  }

  removeEventListener() {
    // Mock implementation
  }
}

global.EventSource = MockEventSource as any;

describe('Run Job Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Set up default streamJob mock
    vi.mocked(ApiClient.streamJob).mockImplementation(() => {
      return new MockEventSource('/mock/stream') as any;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should complete the full run job workflow through stores and hooks', async () => {
    // Mock successful job creation
    const mockJobId = 'test-job-123';
    const mockJobSummary: JobSummary = {
      id: mockJobId,
      status: 'running',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      provider: 'openai',
      model: 'gpt-4o-mini',
      costUsd: null,
      resultSnippet: null,
    };
    vi.mocked(ApiClient.createJob).mockResolvedValue(mockJobSummary);

    // Mock successful job fetching with results
    const mockJobResult: JobDetails = {
      id: mockJobId,
      status: 'completed',
      result: 'Hello, World! This is a test response.',
      prompt: 'Hello {{input}}!',
      provider: 'openai',
      model: 'gpt-4o-mini',
      metrics: {
        sentiment: 0.8,
        flesch_reading_ease: 75.2,
        response_time_ms: 1250,
        token_count: 15,
      },
      tokensUsed: 15,
      costUsd: 0.001,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:05:00Z'),
    };
    vi.mocked(ApiClient.fetchJob).mockResolvedValue(mockJobResult);

    // Step 1: Set up workspace with prompt and input
    const { result: workspaceResult } = renderHook(() => useWorkspaceStore());

    act(() => {
      workspaceResult.current.setTemplate('Hello {{input}}!');
      workspaceResult.current.setInputData('World');
      workspaceResult.current.setModel('gpt-4o-mini');
    });

    // Step 2: Set up job streaming
    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    // Step 3: Execute the job
    const jobParams = {
      template: workspaceResult.current.template,
      inputData: workspaceResult.current.inputData,
      provider: workspaceResult.current.provider,
      model: workspaceResult.current.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    // Mock the streaming functionality properly
    vi.mocked(ApiClient.streamJob).mockImplementation(
      (jobId, onToken, onComplete, onError, onMetrics) => {
        // Simulate streaming with a slight delay
        setTimeout(() => {
          onToken('Hello,');
          onToken(' World!');
          onComplete();
        }, 10);

        return new MockEventSource(`/api/jobs/${jobId}/stream`) as any;
      },
    );

    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Step 4: Verify API was called correctly
    expect(vi.mocked(ApiClient.createJob)).toHaveBeenCalledWith({
      template: 'Hello {{input}}!',
      inputData: 'World',
      prompt: 'Hello World!',
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      metrics: undefined,
    });

    // Step 5: Verify streaming was set up
    expect(vi.mocked(ApiClient.streamJob)).toHaveBeenCalledWith(
      mockJobId,
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
    );

    // Wait for simulated streaming to complete
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Step 6: Verify job completion
    expect(vi.mocked(ApiClient.fetchJob)).toHaveBeenCalledWith(mockJobId);
    expect(jobStreamingResult.current.streamStatus).toBe('complete');
    expect(jobStreamingResult.current.outputText).toContain('Hello, World!');
    expect(jobStreamingResult.current.isExecuting).toBe(false);
  });

  it('should handle job execution errors in the workflow', async () => {
    // Mock API error
    vi.mocked(ApiClient.createJob).mockRejectedValue(new Error('API Error'));

    // Set up workspace
    const { result: workspaceResult } = renderHook(() => useWorkspaceStore());
    act(() => {
      workspaceResult.current.setTemplate('Test prompt');
      workspaceResult.current.setInputData('test input');
    });

    // Set up job streaming
    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    // Execute job
    const jobParams = {
      template: workspaceResult.current.template,
      inputData: workspaceResult.current.inputData,
      provider: workspaceResult.current.provider,
      model: workspaceResult.current.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Verify error handling
    expect(jobStreamingResult.current.streamStatus).toBe('error');
    expect(jobStreamingResult.current.error).toBe('API Error');
    expect(jobStreamingResult.current.isExecuting).toBe(false);
  });

  it('should handle streaming connection errors', async () => {
    // Mock successful job creation but streaming error
    const mockJobSummary2: JobSummary = {
      id: 'test-job-456',
      status: 'running',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      provider: 'openai',
      model: 'gpt-4o-mini',
      costUsd: null,
      resultSnippet: null,
    };
    vi.mocked(ApiClient.createJob).mockResolvedValue(mockJobSummary2);

    // Mock the streaming functionality to trigger an error
    vi.mocked(ApiClient.streamJob).mockImplementation(
      (jobId, onToken, onComplete, onError, onMetrics) => {
        // Simulate an error during streaming
        setTimeout(() => {
          if (onError) {
            onError(new Error('Streaming connection failed'));
          }
        }, 10);

        return new MockEventSource(`/api/jobs/${jobId}/stream`) as any;
      },
    );

    // Set up workspace and job streaming
    const { result: workspaceResult } = renderHook(() => useWorkspaceStore());
    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    act(() => {
      workspaceResult.current.setTemplate('Test prompt');
    });

    const jobParams = {
      template: workspaceResult.current.template,
      inputData: workspaceResult.current.inputData,
      provider: workspaceResult.current.provider,
      model: workspaceResult.current.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Wait for simulated error to trigger
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    // Verify error handling
    expect(jobStreamingResult.current.streamStatus).toBe('error');
  });

  it('should allow job cancellation during workflow execution', async () => {
    // Mock successful job creation
    const mockJobSummary3: JobSummary = {
      id: 'test-job-789',
      status: 'running',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      provider: 'openai',
      model: 'gpt-4o-mini',
      costUsd: null,
      resultSnippet: null,
    };
    vi.mocked(ApiClient.createJob).mockResolvedValue(mockJobSummary3);

    // Set up workspace and job streaming
    const { result: workspaceResult } = renderHook(() => useWorkspaceStore());
    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    act(() => {
      workspaceResult.current.setTemplate('Long running prompt');
    });

    const jobParams = {
      template: workspaceResult.current.template,
      inputData: workspaceResult.current.inputData,
      provider: workspaceResult.current.provider,
      model: workspaceResult.current.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    // Start job execution
    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Verify job is running
    expect(jobStreamingResult.current.isExecuting).toBe(true);

    // Cancel the job
    act(() => {
      jobStreamingResult.current.cancelStream();
    });

    // Verify cancellation
    expect(jobStreamingResult.current.isExecuting).toBe(false);
    expect(jobStreamingResult.current.streamStatus).toBe('complete');
  });
});
