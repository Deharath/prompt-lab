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
  hasUserData: boolean; // Track if user has any prompt/input data
  // Execution state - shared across all components
  isExecuting: boolean;
  isStreaming: boolean;
  // Model parameters
  temperature: number;
  topP: number;
  maxTokens: number;
  selectedMetrics: SelectedMetric[];
  comparison: {
    baseJobId?: string;
    compareJobId?: string;
  };

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
  // Execution state setters
  setIsExecuting(isExecuting: boolean): void;
  setIsStreaming(isStreaming: boolean): void;
}

export const useJobStore = create<JobState>((set, get) => ({
  log: [],
  history: [],
  hasUserData: false,
  // Execution state
  isExecuting: false,
  isStreaming: false,
  // Default parameter values
  temperature: 0.7,
  topP: 1.0,
  maxTokens: 0, // 0 means use model default
  selectedMetrics: [
    // Readability metrics
    { id: 'flesch_reading_ease' },
    { id: 'flesch_kincaid_grade' },
    { id: 'smog_index' },
    { id: 'text_complexity' },

    // Structure metrics
    { id: 'word_count' },
    { id: 'sentence_count' },
    { id: 'token_count' },
    { id: 'avg_words_per_sentence' },

    // Quality metrics
    { id: 'precision' },
    { id: 'recall' },
    { id: 'f_score' },
    { id: 'bleu_score' },
    { id: 'rouge_1' },
    { id: 'rouge_2' },
    { id: 'rouge_l' },
    { id: 'vocab_diversity' },
    { id: 'completeness_score' },

    // Sentiment metrics
    { id: 'sentiment' },
    { id: 'sentiment_detailed' },

    // Keywords metrics
    { id: 'keywords' },
    { id: 'weighted_keywords' },

    // Validation metrics
    { id: 'is_valid_json' },

    // Performance metrics
    { id: 'response_latency' }, // Essential for Model Efficiency dashboard
  ] as SelectedMetric[],
  comparison: {},
  start: (job) => {
    set({
      current: job,
      log: [],
      metrics: undefined,
      hasUserData: true,
    });
  },
  loadHistorical: (job: JobSummary) => {
    // Load historical job data without affecting running state
    set({
      current: job,
      log: [],
      metrics: undefined,
      hasUserData: true,
    });
  },
  append: (text) => {
    set((s) => ({ log: [...s.log, { ts: Date.now(), text }] }));
  },
  finish: (metrics) => {
    set({ metrics });
  },
  reset: () => {
    set({
      current: undefined,
      log: [],
      metrics: undefined,
      isExecuting: false,
      isStreaming: false,
    });
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
    set({ comparison: {} });
  },
  loadHistory: async () => {
    try {
      const jobs = await ApiClient.listJobs();
      set({ history: jobs });
    } catch (error) {
      console.error('Failed to load job history:', error);
    }
  },
  setTemperature: (temperature) => set({ temperature }),
  setTopP: (topP) => set({ topP }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  setSelectedMetrics: (selectedMetrics) => set({ selectedMetrics }),
  // Execution state setters
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
