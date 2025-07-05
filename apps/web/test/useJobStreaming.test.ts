/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock the API client
const mockApiClient = {
  createJob: vi.fn(),
  streamJob: vi.fn(),
  fetchJob: vi.fn(),
};

vi.mock('../src/api.js', () => ({
  ApiClient: mockApiClient,
}));

// Mock the job store
const mockJobStore = {
  start: vi.fn(),
  finish: vi.fn(),
  reset: vi.fn(),
  getState: vi.fn().mockReturnValue({
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 1000,
    selectedMetrics: [],
  }),
};

vi.mock('../src/store/jobStore.js', () => ({
  useJobStore: () => mockJobStore,
}));

import { useJobStreaming } from '../src/hooks/useJobStreaming.js';

describe('useJobStreaming', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useJobStreaming());

    expect(result.current.outputText).toBe('');
    expect(result.current.streamStatus).toBe('complete');
    expect(result.current.error).toBe(null);
    expect(result.current.isExecuting).toBe(false);
    expect(typeof result.current.executeJob).toBe('function');
  });

  it('should execute job successfully', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockEventSource = {
      close: vi.fn(),
      addEventListener: vi.fn(),
      readyState: 1,
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

  it('should handle job creation errors', async () => {
    const error = new Error('Failed to create job');
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

    expect(result.current.error).toBe('Failed to create job');
    expect(result.current.streamStatus).toBe('error');
    expect(result.current.isExecuting).toBe(false);
  });

  it('should process template with input data correctly', async () => {
    const mockJob = { id: 'test-job-id' };
    const mockEventSource = {
      close: vi.fn(),
      addEventListener: vi.fn(),
      readyState: 1,
    };

    mockApiClient.createJob.mockResolvedValue(mockJob);
    mockApiClient.streamJob.mockReturnValue(mockEventSource);

    const { result } = renderHook(() => useJobStreaming());

    const jobParams = {
      template: 'Hello {{name}}, you are {{age}} years old',
      inputData: '{"name": "John", "age": 30}',
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
      prompt: 'Hello John, you are 30 years old',
      template: 'Hello {{name}}, you are {{age}} years old',
      inputData: '{"name": "John", "age": 30}',
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
      metrics: undefined,
    });
  });
});
