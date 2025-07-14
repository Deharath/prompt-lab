import {
  type SelectedMetric,
  type MetricResult,
  type MetricsCalculationResult,
} from '@prompt-lab/shared-types';
import { create } from 'zustand';
import { ApiClient } from '../api.js';
import type { JobSummary } from '../api.js';

interface LogLine {
  ts: number;
  text: string;
}

interface JobState {
  current?: JobSummary;
  log: LogLine[];
  history: JobSummary[];
  metrics?: MetricResult;
  running: boolean;
  hasUserData: boolean; // Track if user has any prompt/input data
  // Model parameters
  temperature: number;
  topP: number;
  maxTokens: number;
  selectedMetrics: SelectedMetric[];
  comparison: {
    baseJobId?: string;
    compareJobId?: string;
  };
  cancelling: boolean;
  cancelTimeoutId?: ReturnType<typeof setTimeout>;
  start(job: JobSummary): void;
  loadHistorical(job: JobSummary): void;
  append(text: string): void;
  finish(metrics: MetricResult): void;
  reset(): void;
  setUserData(hasData: boolean): void;
  setBaseJob(id: string): void;
  setCompareJob(id: string): void;
  clearComparison(): void;
  loadHistory(): Promise<void>;
  setTemperature(value: number): void;
  setTopP(value: number): void;
  setMaxTokens(value: number): void;
  setSelectedMetrics(metrics: SelectedMetric[]): void;
  cancelJob(id: string): Promise<void>;
}

export const useJobStore = create<JobState>((set, get) => ({
  log: [],
  history: [],
  running: false,
  hasUserData: false,
  // Default parameter values
  temperature: 0.7,
  topP: 1.0,
  maxTokens: 0, // 0 means use model default
  selectedMetrics: [
    { id: 'flesch_reading_ease' },
    { id: 'sentiment_detailed' },
    { id: 'sentiment' },
    { id: 'word_count' },
    { id: 'precision' },
    { id: 'recall' },
    { id: 'f_score' },
    { id: 'response_latency' }, // Essential for Model Efficiency dashboard
  ] as SelectedMetric[],
  comparison: {},
  cancelling: false,
  cancelTimeoutId: undefined,
  start: (job) => {
    set({
      current: job,
      log: [],
      metrics: undefined,
      running: true,
      hasUserData: true,
      cancelling: false, // Reset cancelling state when starting
    });
  },
  loadHistorical: (job: JobSummary) => {
    // Load historical job data without setting running state to true
    set({
      current: job,
      log: [],
      metrics: undefined,
      running: false, // Historical jobs are not running
      hasUserData: true,
      cancelling: false,
    });
  },
  append: (text) => {
    set((s) => ({ log: [...s.log, { ts: Date.now(), text }] }));
  },
  finish: (metrics) => {
    set((state) => {
      // Clear any pending cancel timeout
      if (state.cancelTimeoutId) {
        clearTimeout(state.cancelTimeoutId);
      }
      // Don't automatically set running to false here - let the stream completion handler do it
      return { metrics, cancelTimeoutId: undefined };
    });
  },
  reset: () => {
    set((state) => {
      // Clear any pending cancel timeout
      if (state.cancelTimeoutId) {
        clearTimeout(state.cancelTimeoutId);
      }
      return {
        current: undefined,
        log: [],
        metrics: undefined,
        running: false,
        cancelTimeoutId: undefined,
      };
    });
    // Note: We intentionally do NOT reset hasUserData here to preserve the user's input between evaluations
  },
  setUserData: (hasData) => {
    set({ hasUserData: hasData });
  },
  setBaseJob: (id) => {
    set((s) => ({ comparison: { ...s.comparison, baseJobId: id } }));
  },
  setCompareJob: (id) => {
    set((s) => ({ comparison: { ...s.comparison, compareJobId: id } }));
  },
  clearComparison: () => {
    set(() => ({ comparison: {} }));
  },
  loadHistory: async () => {
    try {
      const history = await ApiClient.listJobs();
      set({ history });
    } catch (error) {
      // History loading is not critical, silently fail or set empty history
      set({ history: [] });
    }
  },
  setTemperature: (value) => {
    set({ temperature: value });
  },
  setTopP: (value) => {
    set({ topP: value });
  },
  setMaxTokens: (value) => {
    set({ maxTokens: value });
  },
  setSelectedMetrics: (metrics) => {
    set({ selectedMetrics: metrics });
  },
  cancelJob: async (id) => {
    set({ cancelling: true });

    // Clear any existing timeout
    const currentState = get();
    if (currentState.cancelTimeoutId) {
      clearTimeout(currentState.cancelTimeoutId);
      set({ cancelTimeoutId: undefined });
    }

    try {
      await ApiClient.cancelJob(id);
      // Don't immediately update state - wait for SSE confirmation
      // The SSE 'cancelled' event will update the state

      // Add timeout fallback in case SSE doesn't respond
      // Only set timeout if this is the current running job
      if (currentState.current?.id === id && currentState.running) {
        const timeoutId = setTimeout(() => {
          set((state) => ({
            current:
              state.current?.id === id
                ? { ...state.current, status: 'cancelled' as const }
                : state.current,
            cancelling: false,
            running: state.current?.id === id ? false : state.running,
            cancelTimeoutId: undefined,
          }));
        }, 3000); // 3 second fallback
        set({ cancelTimeoutId: timeoutId });
      } else {
        // Not the current job, just update cancelling state
        set({ cancelling: false });
      }
    } catch (error) {
      set({ cancelling: false });
      throw error;
    }
  },
}));
