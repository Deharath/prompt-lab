import { randomUUID } from 'crypto';
import { db, getDb } from '../db/index.js';
import { jobs, Job, NewJob } from '../db/schema.js';
import { eq, and, gt, lt, desc } from 'drizzle-orm';
import { log } from '../utils/logger.js';
import type { JobMetrics, JobStatus } from '../types/index.js';
import {
  withAverageScore,
  usageFromMetrics,
  logStatusChange,
} from './helpers.js';
import type { JobMetricsWithAvg } from './helpers.js';
import {
  categorizeError,
  shouldRetryError,
  type CategorizedError,
} from '../errors/JobError.js';

export async function createJob(
  data: Omit<NewJob, 'id' | 'status'>,
): Promise<Job> {
  await getDb(); // Ensure database is initialized

  const id = randomUUID();
  const newJob: NewJob = { ...data, id, status: 'pending' };

  log.jobCreated(id, { provider: data.provider, model: data.model });

  const result = await db.insert(jobs).values(newJob).returning();
  return result[0];
}

export async function getJob(id: string): Promise<Job | undefined> {
  await getDb(); // Ensure database is initialized

  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function getPreviousJob(
  currentJobId: string,
): Promise<Job | undefined> {
  await getDb(); // Ensure database is initialized

  // First, get the current job to know its creation time
  const currentJob = await db
    .select({ createdAt: jobs.createdAt })
    .from(jobs)
    .where(eq(jobs.id, currentJobId))
    .limit(1);

  if (currentJob.length === 0) {
    // Current job not found
    return undefined;
  }

  const currentCreatedAt = currentJob[0].createdAt;

  // Find the most recent job that was created before the current job
  const previousJob = await db
    .select()
    .from(jobs)
    .where(lt(jobs.createdAt, currentCreatedAt))
    .orderBy(desc(jobs.createdAt), desc(jobs.id))
    .limit(1);

  return previousJob[0];
}

export async function updateJob(
  id: string,
  data: Partial<{
    status: JobStatus;
    result: string;
    metrics: JobMetrics;
    errorMessage: string;
  }>,
): Promise<Job> {
  await getDb(); // Ensure database is initialized

  const metricsWithAvg =
    data.status === 'completed' && data.metrics
      ? withAverageScore(data.metrics)
      : data.metrics;

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
    ...(metricsWithAvg && { metrics: metricsWithAvg }),
  };

  if (data.status === 'completed' && data.metrics) {
    const usage = usageFromMetrics(data.metrics);
    if (usage.tokensUsed !== undefined) {
      updateData.tokensUsed = usage.tokensUsed;
    }
    if (usage.costUsd !== undefined) {
      updateData.costUsd = usage.costUsd;
    }
  }

  const result = await db
    .update(jobs)
    .set(updateData)
    .where(eq(jobs.id, id))
    .returning();

  const job = result[0];

  logStatusChange(job, data.status, data.errorMessage);

  return job;
}

export interface ListJobsOptions {
  limit?: number;
  offset?: number;
  provider?: string;
  status?: JobStatus;
  since?: Date;
}

// Re-export from shared-types
import type { JobSummary } from '@prompt-lab/shared-types';
export type { JobSummary } from '@prompt-lab/shared-types';

export async function listJobs(
  options: ListJobsOptions = {},
): Promise<JobSummary[]> {
  await getDb();
  const { limit = 20, offset = 0, provider, status, since } = options;

  const conditions = [] as ReturnType<typeof eq>[];
  if (provider) {
    conditions.push(eq(jobs.provider, provider));
  }
  if (status) {
    conditions.push(eq(jobs.status, status));
  }
  if (since) {
    conditions.push(gt(jobs.createdAt, since));
  }

  // Build query in one chain to avoid TypeScript issues with reassignment
  const baseQuery = db
    .select({
      id: jobs.id,
      status: jobs.status,
      createdAt: jobs.createdAt,
      provider: jobs.provider,
      model: jobs.model,
      costUsd: jobs.costUsd,
      metrics: jobs.metrics,
      result: jobs.result,
    })
    .from(jobs);

  const finalQuery =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  const rows = await finalQuery
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const metrics = row.metrics as JobMetricsWithAvg | null;
    // Create a snippet from result (first 100 chars, cleaned up)
    const resultSnippet = row.result
      ? row.result.replace(/\s+/g, ' ').trim().substring(0, 100) +
        (row.result.length > 100 ? '...' : '')
      : null;

    return {
      id: row.id,
      status: row.status as JobStatus,
      createdAt: row.createdAt,
      provider: row.provider,
      model: row.model,
      costUsd: row.costUsd,
      avgScore: metrics?.avgScore ?? null,
      resultSnippet,
    };
  });
}

export async function retryJob(id: string): Promise<Job | null> {
  await getDb();

  const job = await getJob(id);
  if (!job) {
    return null;
  }

  // Only retry failed jobs
  if (job.status !== 'failed') {
    throw new Error(`Cannot retry job with status '${job.status}'`);
  }

  // Get current attempt count (defaulting to 1 for existing jobs)
  const currentAttempts = (job as any).attemptCount || 1;
  const maxAttempts = (job as any).maxAttempts || 3;

  // Check if we should retry based on error type
  const errorType = (job as any).errorType || 'unknown';
  if (!shouldRetryError(errorType, currentAttempts, maxAttempts)) {
    throw new Error(
      `Job cannot be retried: ${errorType} after ${currentAttempts} attempts`,
    );
  }

  // Create new job with incremented attempt count
  const retryJobData = {
    prompt: job.prompt,
    template: job.template,
    inputData: job.inputData,
    provider: job.provider,
    model: job.model,
    temperature: job.temperature,
    topP: job.topP,
    maxTokens: job.maxTokens,
    selectedMetrics: job.selectedMetrics,
    // Increment attempt count
    attemptCount: currentAttempts + 1,
    maxAttempts,
  };

  const newJob = await createJob(retryJobData as any);

  log.info(
    `Job ${id} retried as ${newJob.id}, attempt ${currentAttempts + 1}/${maxAttempts}`,
  );

  return newJob;
}

export async function updateJobWithError(
  id: string,
  error: unknown,
): Promise<Job> {
  const categorizedError = categorizeError(error);

  const updateData: Parameters<typeof updateJob>[1] = {
    status: 'failed',
    errorMessage: categorizedError.message,
  };

  // Add error type if we have the schema field (will be ignored if not available)
  (updateData as any).errorType = categorizedError.type;

  return updateJob(id, updateData);
}

export async function deleteJob(id: string): Promise<boolean> {
  await getDb(); // Ensure database is initialized

  const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();

  if (result.length === 0) {
    return false; // Job not found
  }

  log.info(`Job deleted: ${id}`);
  return true;
}
