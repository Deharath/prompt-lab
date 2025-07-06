import { Job, NewJob } from '../db/schema.js';
import type { JobMetrics, JobStatus } from '../types/index.js';
export declare function createJob(
  data: Omit<NewJob, 'id' | 'status'>,
): Promise<Job>;
export declare function getJob(id: string): Promise<Job | undefined>;
export declare function getPreviousJob(
  currentJobId: string,
): Promise<Job | undefined>;
export declare function updateJob(
  id: string,
  data: Partial<{
    status: JobStatus;
    result: string;
    metrics: JobMetrics;
    errorMessage: string;
  }>,
): Promise<Job>;
export interface ListJobsOptions {
  limit?: number;
  offset?: number;
  provider?: string;
  status?: JobStatus;
  since?: Date;
}
export interface JobSummary {
  id: string;
  status: JobStatus;
  createdAt: Date;
  provider: string;
  model: string;
  costUsd: number | null;
  avgScore: number | null;
  resultSnippet: string | null;
}
export declare function listJobs(
  options?: ListJobsOptions,
): Promise<JobSummary[]>;
export declare function deleteJob(id: string): Promise<boolean>;
