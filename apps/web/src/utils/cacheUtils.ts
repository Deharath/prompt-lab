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

export const addJobToCache = (queryClient: QueryClient, job: JobSummary) => {
  queryClient.setQueryData(['jobs'], (oldJobs: JobSummary[] = []) => {
    return [job, ...oldJobs];
  });
};
