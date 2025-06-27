import { create } from 'zustand';
import type { JobSummary } from '../api.js';

interface LogLine {
  ts: number;
  text: string;
}

interface JobState {
  current?: JobSummary;
  log: LogLine[];
  metrics?: Record<string, number>;
  running: boolean;
  start(job: JobSummary): void;
  append(text: string): void;
  finish(metrics: Record<string, number>): void;
  reset(): void;
}

export const useJobStore = create<JobState>((set) => ({
  log: [],
  running: false,
  start: (job) =>
    set({ current: job, log: [], metrics: undefined, running: true }),
  append: (text) => set((s) => ({ log: [...s.log, { ts: Date.now(), text }] })),
  finish: (metrics) => set({ metrics, running: false }),
  reset: () =>
    set({ current: undefined, log: [], metrics: undefined, running: false }),
}));
