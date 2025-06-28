import { randomUUID } from 'crypto';
import { db, getDb } from '../db/index.js';
import { jobs, Job, NewJob } from '../db/schema.js';
import { eq, and, gt, desc } from 'drizzle-orm';
import { log } from '../utils/logger.js';
import type { JobMetrics, JobStatus } from '../types/index.js';
import {
  withAverageScore,
  usageFromMetrics,
  logStatusChange,
} from './helpers.js';
import type { JobMetricsWithAvg } from './helpers.js';

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

export interface JobSummary {
  id: string;
  createdAt: Date;
  provider: string;
  model: string;
  costUsd: number | null;
  avgScore: number | null;
}

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
      createdAt: jobs.createdAt,
      provider: jobs.provider,
      model: jobs.model,
      costUsd: jobs.costUsd,
      metrics: jobs.metrics,
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
    return {
      id: row.id,
      createdAt: row.createdAt,
      provider: row.provider,
      model: row.model,
      costUsd: row.costUsd,
      avgScore: metrics?.avgScore ?? null,
    };
  });
}
