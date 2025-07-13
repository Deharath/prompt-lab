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
  start(job: JobSummary): void;
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

export const useJobStore = create<JobState>((set) => ({
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
  start: (job) => {
    set({
      current: job,
      log: [],
      metrics: undefined,
      running: true,
      hasUserData: true,
    });
  },
  append: (text) => {
    set((s) => ({ log: [...s.log, { ts: Date.now(), text }] }));
  },
  finish: (metrics) => {
    set({ metrics, running: false });
  },
  reset: () => {
    set({ current: undefined, log: [], metrics: undefined, running: false });
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
    try {
      await ApiClient.cancelJob(id);
      // Update current job if it's the one being cancelled
      set((state) => ({
        current:
          state.current?.id === id
            ? { ...state.current, status: 'cancelled' as const }
            : state.current,
        cancelling: false,
        running: false,
      }));
      // Refresh history to reflect cancelled status
      const history = await ApiClient.listJobs();
      set({ history });
    } catch (error) {
      set({ cancelling: false });
      throw error;
    }
  },
}));
