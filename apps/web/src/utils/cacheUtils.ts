import { QueryClient } from '@tanstack/react-query';
import type { JobSummary } from '../api.js';

export interface JobUpdate {
  id: string;
  status?: string;
  costUsd?: number | null;
  resultSnippet?: string | null;
}

export const batchUpdateJobsCache = (
  queryClient: QueryClient,
  updates: JobUpdate[],
) => {
  queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] = []) => {
    return oldJobs.map((job) => {
      const update = updates.find((u) => u.id === job.id);
      return update ? { ...job, ...update } : job;
    });
  });
};
/**
 * Updates job cache while preserving existing resultSnippet if not provided in update
 */
export const batchUpdateJobsCachePreserveSnippet = (
  queryClient: QueryClient,
  updates: JobUpdate[],
) => {
  queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] = []) => {
    return oldJobs.map((job) => {
      const update = updates.find((u) => u.id === job.id);
      if (!update) return job;

      // Preserve existing snippet if update doesn't include one
      const preservedSnippet =
        update.resultSnippet === undefined
          ? job.resultSnippet
          : update.resultSnippet;

      return { ...job, ...update, resultSnippet: preservedSnippet };
    });
  });
};

export const addJobToCache = (queryClient: QueryClient, job: JobSummary) => {
  queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] = []) => {
    return [job, ...oldJobs];
  });
};
