/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the API client
vi.mock('../src/api.js', () => ({
  ApiClient: {
    createJob: vi.fn(),
    streamJob: vi.fn(),
    fetchJob: vi.fn(),
  },
}));

// Mock the job store
vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: () => ({
    start: vi.fn(),
    finish: vi.fn(),
    reset: vi.fn(),
    getState: vi.fn().mockReturnValue({
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    }),
  }),
}));

import { useJobStreaming } from '../src/hooks/useJobStreaming.js';
import { ApiClient } from '../src/api.js';
import { useJobStore } from '../src/store/jobStore.js';

describe('useJobStreaming', () => {
  const mockApiClient = ApiClient as any;
  const mockJobStore = useJobStore() as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useJobStreaming());

    expect(result.current.outputText).toBe('');
    expect(result.current.streamStatus).toBe('complete');
    expect(result.current.error).toBe('');
    expect(result.current.isExecuting).toBe(false);
    expect(typeof result.current.executeJob).toBe('function');
    expect(typeof result.current.reset).toBe('function');
    expect(typeof result.current.cancelStream).toBe('function');
  });

  it('should execute job successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockEventSource = {
      close: vi.fn(),
    };

    mockApiClient.createJob.mockResolvedValue(mockJob);
    mockApiClient.streamJob.mockReturnValue(mockEventSource);

    const { result } = renderHook(() => useJobStreaming());

    const jobParams = {
      template: 'Test template {{input}}',
      inputData: 'test input',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await result.current.executeJob(jobParams);
    });

    expect(mockApiClient.createJob).toHaveBeenCalledWith({
      prompt: 'Test template test input',
      template: 'Test template {{input}}',
      inputData: 'test input',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      metrics: undefined,
    });

    expect(mockJobStore.start).toHaveBeenCalledWith(mockJob);
    expect(result.current.streamStatus).toBe('streaming');
    expect(result.current.isExecuting).toBe(true);
  });

  it('should handle job execution errors gracefully', async () => {
    const error = new Error('API Error');
    mockApiClient.createJob.mockRejectedValue(error);

    const { result } = renderHook(() => useJobStreaming());

    const jobParams = {
      template: 'Test template',
      inputData: 'test input',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await result.current.executeJob(jobParams);
    });

    expect(result.current.streamStatus).toBe('error');
    expect(result.current.error).toBe('API Error');
    expect(result.current.isExecuting).toBe(false);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useJobStreaming());

    // Set some state first
    act(() => {
      result.current.reset();
    });

    expect(result.current.outputText).toBe('');
    expect(result.current.streamStatus).toBe('complete');
    expect(result.current.error).toBe('');
    expect(result.current.isExecuting).toBe(false);
    expect(mockJobStore.reset).toHaveBeenCalled();
  });

  it('should replace {{input}} placeholders correctly', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockEventSource = { close: vi.fn() };

    mockApiClient.createJob.mockResolvedValue(mockJob);
    mockApiClient.streamJob.mockReturnValue(mockEventSource);

    const { result } = renderHook(() => useJobStreaming());

    const jobParams = {
      template: 'Process this: {{input}} and also {{input}}',
      inputData: 'sample data',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics: [],
    };

    await act(async () => {
      await result.current.executeJob(jobParams);
    });

    expect(mockApiClient.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Process this: sample data and also sample data',
      }),
    );
  });

  it('should handle metrics correctly when provided', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockEventSource = { close: vi.fn() };
    const selectedMetrics = [{ id: 'metric1', name: 'Test Metric' }];

    mockApiClient.createJob.mockResolvedValue(mockJob);
    mockApiClient.streamJob.mockReturnValue(mockEventSource);

    const { result } = renderHook(() => useJobStreaming());

    const jobParams = {
      template: 'Test template',
      inputData: 'test input',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      selectedMetrics,
    };

    await act(async () => {
      await result.current.executeJob(jobParams);
    });

    expect(mockApiClient.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: selectedMetrics,
      }),
    );
  });
});
