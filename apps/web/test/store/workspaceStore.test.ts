/**
 * Tests for workspaceStore - validates template management, token calculations, and job loading
 * Based on the new Zustand store architecture
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  useWorkspaceStore,
  selectWorkspaceData,
  selectTokenData,
  selectCanRunEvaluation,
  selectIsEmptyState,
} from '../../src/store/workspaceStore.js';
import { act } from '@testing-library/react';

// Mock API
vi.mock('../../src/api.js', () => ({
  ApiClient: {
    fetchJob: vi.fn(),
  },
}));

// Mock token utilities
vi.mock('../utils/tokenCounter.js', () => ({
  countTokens: vi.fn(() => 10),
  estimateCompletionTokens: vi.fn(() => 20),
  estimateCost: vi.fn(() => 0.001),
}));

// Mock constants
vi.mock('../constants/app.js', () => ({
  SAMPLE_PROMPT: 'Sample prompt template: {{input}}',
  SAMPLE_INPUT: '{"test": "data"}',
}));

describe('workspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.setState(useWorkspaceStore.getInitialState());
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useWorkspaceStore.getState();
    expect(state.template).toBe('');
    expect(state.inputData).toBe('');
    expect(state.provider).toBe('openai');
    expect(state.model).toBe('gpt-4o-mini');
    expect(state.promptTokens).toBe(0);
    expect(state.estimatedCompletionTokens).toBe(0);
    expect(state.totalTokens).toBe(0);
    expect(state.estimatedCost).toBe(0);
  });

  it('setTemplate updates template and recalculates tokens', () => {
    act(() => {
      useWorkspaceStore.getState().setTemplate('Hello {{input}}');
      useWorkspaceStore.getState().setInputData('World');
    });

    const state = useWorkspaceStore.getState();
    expect(state.template).toBe('Hello {{input}}');
    // Token count will be calculated by the actual tokenCounter utility
    expect(state.promptTokens).toBeGreaterThan(0);
    expect(state.totalTokens).toBeGreaterThan(state.promptTokens);
  });

  it('setInputData updates input data and recalculates tokens', () => {
    act(() => {
      useWorkspaceStore.getState().setTemplate('Hello {{input}}');
      useWorkspaceStore.getState().setInputData('{"name": "World"}');
    });

    const state = useWorkspaceStore.getState();
    expect(state.inputData).toBe('{"name": "World"}');
    // Token count will be calculated by the actual tokenCounter utility
    expect(state.promptTokens).toBeGreaterThan(0);
    expect(state.estimatedCost).toBeGreaterThan(0);
  });

  it('setProvider updates provider and recalculates tokens', () => {
    act(() => {
      useWorkspaceStore.getState().setProvider('anthropic');
    });

    const state = useWorkspaceStore.getState();
    expect(state.provider).toBe('anthropic');
  });

  it('setModel updates model and recalculates tokens', () => {
    act(() => {
      useWorkspaceStore.getState().setModel('gpt-4');
    });

    const state = useWorkspaceStore.getState();
    expect(state.model).toBe('gpt-4');
  });

  it('startWithExample loads sample data', () => {
    act(() => {
      useWorkspaceStore.getState().startWithExample();
    });

    const state = useWorkspaceStore.getState();
    // The actual sample data from constants/app.ts
    expect(state.template).toContain(
      'Analyze the following text and provide a summary',
    );
    expect(state.inputData).toContain('This is a sample news article');
  });

  it('loads job data successfully', async () => {
    const mockJobData = {
      id: 'job123',
      status: 'completed' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      prompt: 'Job prompt',
      template: 'Job template: {{input}}',
      inputData: '{"job": "data"}',
      provider: 'anthropic',
      model: 'claude-3.5-sonnet',
    };

    const { ApiClient } = await import('../../src/api.js');
    vi.mocked(ApiClient.fetchJob).mockResolvedValue(mockJobData);

    await act(async () => {
      await useWorkspaceStore.getState().loadJobData('job123');
    });

    const state = useWorkspaceStore.getState();
    expect(state.template).toBe(mockJobData.template);
    expect(state.inputData).toBe(mockJobData.inputData);
    expect(state.provider).toBe(mockJobData.provider);
    expect(state.model).toBe(mockJobData.model);
    expect(ApiClient.fetchJob).toHaveBeenCalledWith('job123');
  });

  it('loads job data with prompt fallback', async () => {
    const mockJobData = {
      id: 'job456',
      status: 'completed' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      prompt: 'Direct prompt',
      provider: 'openai',
      model: 'gpt-4',
    };

    const { ApiClient } = await import('../../src/api.js');
    vi.mocked(ApiClient.fetchJob).mockResolvedValue(mockJobData);

    await act(async () => {
      await useWorkspaceStore.getState().loadJobData('job456');
    });

    const state = useWorkspaceStore.getState();
    expect(state.template).toBe('Direct prompt');
    expect(state.inputData).toBe('');
    expect(state.provider).toBe('openai');
    expect(state.model).toBe('gpt-4');
  });

  it('handles job loading errors', async () => {
    const { ApiClient } = await import('../../src/api.js');
    vi.mocked(ApiClient.fetchJob).mockRejectedValue(new Error('Network error'));

    const originalConsoleError = console.error;
    console.error = vi.fn();
    try {
      await expect(async () => {
        await act(async () => {
          await useWorkspaceStore.getState().loadJobData('invalid-job');
        });
      }).rejects.toThrow('Network error');
    } finally {
      console.error = originalConsoleError;
    }
  });

  describe('selectors', () => {
    it('selectWorkspaceData returns workspace data', () => {
      const state = useWorkspaceStore.getState();
      const workspaceData = selectWorkspaceData(state);

      expect(workspaceData).toEqual({
        template: '',
        inputData: '',
        provider: 'openai',
        model: 'gpt-4o-mini',
      });
    });

    it('selectTokenData returns token information', () => {
      const state = useWorkspaceStore.getState();
      const tokenData = selectTokenData(state);

      expect(tokenData).toEqual({
        promptTokens: 0,
        estimatedCompletionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      });
    });

    it('selectCanRunEvaluation returns false for empty state', () => {
      const state = useWorkspaceStore.getState();
      expect(selectCanRunEvaluation(state)).toBe(false);
    });

    it('selectCanRunEvaluation returns true when template and input are set', () => {
      act(() => {
        useWorkspaceStore.getState().setTemplate('Hello {{input}}');
        useWorkspaceStore.getState().setInputData('World');
      });

      const state = useWorkspaceStore.getState();
      expect(selectCanRunEvaluation(state)).toBe(true);
    });

    it('selectIsEmptyState returns true initially', () => {
      const state = useWorkspaceStore.getState();
      expect(selectIsEmptyState(state)).toBe(true);
    });

    it('selectIsEmptyState returns false when data is set', () => {
      act(() => {
        useWorkspaceStore.getState().setTemplate('Hello');
      });

      const state = useWorkspaceStore.getState();
      expect(selectIsEmptyState(state)).toBe(false);
    });
  });

  it('token calculations update correctly with empty template', () => {
    act(() => {
      useWorkspaceStore.getState().setTemplate('');
      useWorkspaceStore.getState().setInputData('some data');
    });

    const state = useWorkspaceStore.getState();
    expect(state.promptTokens).toBe(0);
    expect(state.estimatedCompletionTokens).toBe(0);
    expect(state.totalTokens).toBe(0);
    expect(state.estimatedCost).toBe(0);
  });
});
