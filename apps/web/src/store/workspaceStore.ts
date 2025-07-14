import { create } from 'zustand';
import { ApiClient } from '../api.js';
import { SAMPLE_PROMPT, SAMPLE_INPUT } from '../constants/app.js';
import { useJobStore } from './jobStore.js';
import {
  countTokens,
  estimateCompletionTokens,
  estimateCost,
} from '../utils/tokenCounter.js';

interface WorkspaceState {
  // Core state
  template: string;
  inputData: string;
  provider: string;
  model: string;

  // Computed values (memoized internally)
  promptTokens: number;
  estimatedCompletionTokens: number;
  totalTokens: number;
  estimatedCost: number;

  // Actions
  setTemplate: (template: string) => void;
  setInputData: (inputData: string) => void;
  setProvider: (provider: string) => void;
  setModel: (model: string) => void;
  reset: () => void;
  startWithExample: () => void;
  loadJobData: (jobId: string) => Promise<void>;

  // Internal method for computing token data
  _updateTokenData: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial state
  template: '',
  inputData: '',
  provider: 'openai',
  model: 'gpt-4o-mini',

  // Computed values
  promptTokens: 0,
  estimatedCompletionTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,

  // Actions
  setTemplate: (template: string) => {
    set({ template });
    get()._updateTokenData();
  },

  setInputData: (inputData: string) => {
    set({ inputData });
    get()._updateTokenData();
  },

  setProvider: (provider: string) => {
    set({ provider });
    get()._updateTokenData();
  },

  setModel: (model: string) => {
    set({ model });
    get()._updateTokenData();
  },

  reset: () => {
    set({
      template: '',
      inputData: '',
      provider: 'openai',
      model: 'gpt-4o-mini',
      promptTokens: 0,
      estimatedCompletionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    });
  },

  startWithExample: () => {
    set({
      template: SAMPLE_PROMPT,
      inputData: SAMPLE_INPUT,
    });
    get()._updateTokenData();
  },

  loadJobData: async (jobId: string) => {
    try {
      const jobDetails = await ApiClient.fetchJob(jobId);

      if (jobDetails.template && jobDetails.inputData) {
        set({
          template: jobDetails.template,
          inputData: jobDetails.inputData,
          provider: jobDetails.provider,
          model: jobDetails.model,
        });
      } else if (jobDetails.prompt) {
        set({
          template: jobDetails.prompt,
          inputData: '',
          provider: jobDetails.provider,
          model: jobDetails.model,
        });
      }

      // Get job store actions
      const { finish, reset } = useJobStore.getState();

      // Always reset the job store first to clear any previous state
      reset();

      // Load historical job result into log if available
      if (jobDetails.result) {
        // Create a mock job to populate the store with historical data
        const mockJob = {
          id: jobDetails.id,
          status: jobDetails.status,
          createdAt: jobDetails.createdAt,
          updatedAt: jobDetails.updatedAt,
        };

        // Start with the job to set up the store
        useJobStore.getState().start(mockJob);

        // Add the result to the log
        useJobStore.getState().append(jobDetails.result);
      }

      // Handle metrics loading based on job status
      if (jobDetails.metrics && jobDetails.status === 'completed') {
        // Only load metrics for genuinely completed jobs
        finish(jobDetails.metrics);
      } else {
        // For cancelled, failed, or other non-completed jobs, clear any existing metrics
        // This prevents showing results from previously loaded completed jobs
        finish({});
      }

      get()._updateTokenData();
    } catch (error) {
      // Job details loading error handled by user notification
      console.error('Failed to load job details:', error);
      throw error;
    }
  },

  // Internal method to update computed values
  _updateTokenData: () => {
    const { template, inputData, model } = get();

    if (!template || !inputData) {
      set({
        promptTokens: 0,
        estimatedCompletionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
      });
      return;
    }

    const finalPrompt = template.replace(/\{\{\s*input\s*\}\}/g, inputData);
    const promptTokens = countTokens(finalPrompt, model);
    const estimatedCompletionTokens = estimateCompletionTokens(
      finalPrompt,
      model,
    );
    const totalTokens = promptTokens + estimatedCompletionTokens;
    const estimatedCost = estimateCost(
      promptTokens,
      estimatedCompletionTokens,
      model,
    );

    set({
      promptTokens,
      estimatedCompletionTokens,
      totalTokens,
      estimatedCost,
    });
  },
}));

// Selectors for common computed values
export const selectWorkspaceData = (state: WorkspaceState) => ({
  template: state.template,
  inputData: state.inputData,
  provider: state.provider,
  model: state.model,
});

export const selectTokenData = (state: WorkspaceState) => ({
  promptTokens: state.promptTokens,
  estimatedCompletionTokens: state.estimatedCompletionTokens,
  totalTokens: state.totalTokens,
  estimatedCost: state.estimatedCost,
});

export const selectCanRunEvaluation = (state: WorkspaceState) =>
  !!(state.template && state.inputData);

export const selectIsEmptyState = (state: WorkspaceState) =>
  !state.template && !state.inputData;
