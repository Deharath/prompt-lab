import { create } from 'zustand';
import { listJobs } from '../api.js';
import type { JobSummary } from '../api.js';

interface LogLine {
  ts: number;
  text: string;
}

interface JobState {
  current?: JobSummary;
  log: LogLine[];
  history: JobSummary[];
  metrics?: Record<string, number>;
  running: boolean;
  hasUserData: boolean; // Track if user has any prompt/input data
  comparison: {
    baseJobId?: string;
    compareJobId?: string;
  };
  start(job: JobSummary): void;
  append(text: string): void;
  finish(metrics: Record<string, number>): void;
  reset(): void;
  setUserData(hasData: boolean): void;
  setBaseJob(id: string): void;
  setCompareJob(id: string): void;
  clearComparison(): void;
  loadHistory(): Promise<void>;
}

export const useJobStore = create<JobState>((set) => ({
  log: [],
  history: [],
  running: false,
  hasUserData: false,
  comparison: {},
  start: (job) => {
    console.log('🏁 Store: Starting job', job);
    set({
      current: job,
      log: [],
      metrics: undefined,
      running: true,
      hasUserData: true,
    });
  },
  append: (text) => {
    console.log('📝 Store: Appending text', text);
    set((s) => ({ log: [...s.log, { ts: Date.now(), text }] }));
  },
  finish: (metrics) => {
    console.log('🎯 Store: Finishing with metrics', metrics);
    set({ metrics, running: false });
  },
  reset: () => {
    console.log('🔄 Store: Resetting');
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
    console.log('📜 Store: Loading history');
    try {
      const history = await listJobs();
      set({ history });
    } catch (err) {
      console.error('Failed to load history', err);
    }
  },
}));
