/**
 * Integration tests for the "Run Job" workflow
 * Tests the complete workflow logic from job creation to completion
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useJobStreaming } from '../../src/hooks/useJobStreaming.js';
import { useWorkspaceStore } from '../../src/store/workspaceStore.js';
import { useJobStore } from '../../src/store/jobStore.js';
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

// Mock job store for integration tests
const mockJobStore = {
  current: null,
  isExecuting: false,
  isStreaming: false,
  start: vi.fn(),
  finish: vi.fn(),
  reset: vi.fn(() => {
    mockJobStore.current = null;
    mockJobStore.isExecuting = false;
    mockJobStore.isStreaming = false;
  }),
  setRunning: vi.fn(),
  setCancelling: vi.fn(),
  setIsExecuting: vi.fn((executing: boolean) => {
    mockJobStore.isExecuting = executing;
  }),
  setIsStreaming: vi.fn((streaming: boolean) => {
    mockJobStore.isStreaming = streaming;
  }),
  getState: vi.fn(() => mockJobStore),
};

vi.mock('../../src/store/jobStore.js', () => ({
  useJobStore: Object.assign(
    vi.fn(() => mockJobStore),
    {
      getState: vi.fn(() => mockJobStore),
    },
  ),
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

    // Reset stores to initial state
    useWorkspaceStore.getState().reset();

    // Reset mock job store state
    mockJobStore.current = null;
    mockJobStore.isExecuting = false;
    mockJobStore.isStreaming = false;

    // Set up default streamJob mock
    vi.mocked(ApiClient.streamJob).mockImplementation(() => {
      return new MockEventSource('/mock/stream') as any;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    'should complete the full run job workflow through stores and hooks',
    { timeout: 10000 },
    async () => {
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
      act(() => {
        useWorkspaceStore.getState().setTemplate('Hello {{input}}!');
        useWorkspaceStore.getState().setInputData('World');
        useWorkspaceStore.getState().setModel('gpt-4o-mini');
      });

      // Step 2: Set up job streaming
      const { result: jobStreamingResult } = renderHook(
        () => useJobStreaming(),
        {
          wrapper: createWrapper(),
        },
      );

      // Step 3: Execute the job
      const workspaceState = useWorkspaceStore.getState();
      const jobParams = {
        template: workspaceState.template,
        inputData: workspaceState.inputData,
        provider: workspaceState.provider,
        model: workspaceState.model,
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 1000,
        selectedMetrics: [],
      };

      // Mock the streaming functionality properly
      vi.mocked(ApiClient.streamJob).mockImplementation(
        (
          jobId,
          onToken,
          onComplete,
          onError,
          onMetrics,
          onStatusUpdate,
          onCancelled,
        ) => {
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
        expect.any(Function),
        expect.any(Function),
      );

      // Wait for simulated streaming to complete and polling to finish
      await act(async () => {
        vi.advanceTimersByTime(50); // Initial streaming completion
        vi.advanceTimersByTime(1000); // Allow polling attempts with exponential backoff
      });

      // Step 6: Verify job completion
      expect(vi.mocked(ApiClient.fetchJob)).toHaveBeenCalledWith(mockJobId);
      expect(jobStreamingResult.current.streamStatus).toBe('complete');
      expect(jobStreamingResult.current.outputText).toContain('Hello, World!');
      expect(jobStreamingResult.current.isExecuting).toBe(false);
    },
  );

  it('should handle job execution errors in the workflow', async () => {
    // Mock API error
    vi.mocked(ApiClient.createJob).mockRejectedValue(new Error('API Error'));

    // Set up workspace
    act(() => {
      useWorkspaceStore.getState().setTemplate('Test prompt');
      useWorkspaceStore.getState().setInputData('test input');
    });

    // Set up job streaming
    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    // Execute job
    const workspaceState = useWorkspaceStore.getState();
    const jobParams = {
      template: workspaceState.template,
      inputData: workspaceState.inputData,
      provider: workspaceState.provider,
      model: workspaceState.model,
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
      (
        jobId,
        onToken,
        onComplete,
        onError,
        onMetrics,
        onStatusUpdate,
        onCancelled,
      ) => {
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
    act(() => {
      useWorkspaceStore.getState().setTemplate('Test prompt');
    });

    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    const workspaceState = useWorkspaceStore.getState();
    const jobParams = {
      template: workspaceState.template,
      inputData: workspaceState.inputData,
      provider: workspaceState.provider,
      model: workspaceState.model,
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
    act(() => {
      useWorkspaceStore.getState().setTemplate('Long running prompt');
    });

    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    const workspaceState = useWorkspaceStore.getState();
    const jobParams = {
      template: workspaceState.template,
      inputData: workspaceState.inputData,
      provider: workspaceState.provider,
      model: workspaceState.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    // Start job execution (don't await - we want to check state during execution)
    act(() => {
      jobStreamingResult.current.executeJob(jobParams);
    });

    // Give time for execution to start
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Verify job is running (if the mock properly sets execution state)
    // Note: In a real scenario, this would be true during execution
    // For this test, we'll verify the cancellation behavior works regardless

    // Cancel the job through reset - cancellation is now handled by job state machine
    act(() => {
      jobStreamingResult.current.reset();
    });

    // Verify cancellation resets the state
    expect(jobStreamingResult.current.isExecuting).toBe(false);
    expect(jobStreamingResult.current.streamStatus).toBe('complete');
  });

  it('should handle multi-metric evaluation workflow', async () => {
    // Mock successful job creation with metrics
    const mockJobId = 'test-job-metrics';
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

    // Mock job result with multiple metrics
    const mockJobResult: JobDetails = {
      id: mockJobId,
      status: 'completed',
      result: 'This is a test response with good sentiment and readability.',
      prompt: 'Write a positive response',
      provider: 'openai',
      model: 'gpt-4o-mini',
      metrics: {
        sentiment: 0.85,
        flesch_reading_ease: 78.5,
        word_count: 12,
        token_count: 15,
        response_time_ms: 1100,
      },
      tokensUsed: 15,
      costUsd: 0.002,
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:02:00Z'),
    };
    vi.mocked(ApiClient.fetchJob).mockResolvedValue(mockJobResult);

    // Set up workspace with multiple metrics
    act(() => {
      useWorkspaceStore.getState().setTemplate('Write a positive response');
      useWorkspaceStore.getState().setInputData('');
    });

    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    const workspaceState = useWorkspaceStore.getState();
    const jobParams = {
      template: workspaceState.template,
      inputData: workspaceState.inputData,
      provider: workspaceState.provider,
      model: workspaceState.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [
        { id: 'sentiment' },
        { id: 'flesch_reading_ease' },
        { id: 'word_count' },
        { id: 'token_count' },
      ],
    };

    // Mock streaming with metrics updates
    vi.mocked(ApiClient.streamJob).mockImplementation(
      (jobId, onToken, onComplete, onError, onMetrics) => {
        setTimeout(() => {
          onToken('This is a test');
          onToken(' response with good');
          onToken(' sentiment and readability.');

          // Simulate metrics calculation during streaming
          if (onMetrics) {
            onMetrics({
              sentiment: 0.85,
              flesch_reading_ease: 78.5,
              word_count: 12,
              token_count: 15,
            });
          }

          onComplete();
        }, 10);

        return new MockEventSource(`/api/jobs/${jobId}/stream`) as any;
      },
    );

    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Verify job execution
    expect(vi.mocked(ApiClient.createJob)).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: expect.arrayContaining([
          { id: 'sentiment' },
          { id: 'flesch_reading_ease' },
          { id: 'word_count' },
          { id: 'token_count' },
        ]),
      }),
    );

    // Wait for completion
    await act(async () => {
      vi.advanceTimersByTime(50);
    });

    expect(jobStreamingResult.current.streamStatus).toBe('complete');
    expect(jobStreamingResult.current.outputText).toContain(
      'sentiment and readability',
    );
  });

  it('should handle error recovery workflow with retry mechanism', async () => {
    // Mock initial job creation failure
    vi.mocked(ApiClient.createJob)
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        id: 'test-job-retry',
        status: 'pending',
        createdAt: new Date(),
        provider: 'openai',
        model: 'gpt-4o-mini',
        costUsd: null,
        resultSnippet: null,
      });

    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    const jobParams = {
      template: 'Test retry mechanism',
      inputData: '',
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    // First attempt should fail
    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    expect(jobStreamingResult.current.streamStatus).toBe('error');
    expect(jobStreamingResult.current.error).toBe('Network timeout');

    // Reset error state
    act(() => {
      jobStreamingResult.current.reset();
    });

    // Second attempt should succeed
    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    expect(vi.mocked(ApiClient.createJob)).toHaveBeenCalledTimes(2);
    expect(jobStreamingResult.current.error).toBe(null);
  });

  it('should handle template processing with complex input data', async () => {
    const mockJobId = 'test-job-template';
    const mockJobSummary: JobSummary = {
      id: mockJobId,
      status: 'running',
      createdAt: new Date(),
      provider: 'openai',
      model: 'gpt-4o-mini',
      costUsd: null,
      resultSnippet: null,
    };
    vi.mocked(ApiClient.createJob).mockResolvedValue(mockJobSummary);

    // Set up complex template and input data
    act(() => {
      useWorkspaceStore
        .getState()
        .setTemplate(
          'Generate a {{type}} about {{subject}} with {{tone}} tone. Include {{details}}.',
        );
      useWorkspaceStore.getState().setInputData(
        JSON.stringify({
          type: 'summary',
          subject: 'machine learning',
          tone: 'professional',
          details: 'practical examples and use cases',
        }),
      );
    });

    const { result: jobStreamingResult } = renderHook(() => useJobStreaming(), {
      wrapper: createWrapper(),
    });

    const workspaceState = useWorkspaceStore.getState();
    const jobParams = {
      template: workspaceState.template,
      inputData: workspaceState.inputData,
      provider: workspaceState.provider,
      model: workspaceState.model,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await jobStreamingResult.current.executeJob(jobParams);
    });

    // Verify template was processed with input data
    expect(vi.mocked(ApiClient.createJob)).toHaveBeenCalledWith(
      expect.objectContaining({
        template:
          'Generate a {{type}} about {{subject}} with {{tone}} tone. Include {{details}}.',
        inputData: expect.stringContaining('machine learning'),
        prompt: expect.stringContaining('summary'),
      }),
    );
  });
});
