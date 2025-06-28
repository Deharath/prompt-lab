import { randomUUID } from 'crypto';
import { db, getDb } from '../db/index.js';
import { jobs, Job, NewJob } from '../db/schema.js';
import { eq, and, gt, desc } from 'drizzle-orm';
import { log } from '../utils/logger.js';
import type { JobMetrics, JobStatus } from '../types/index.js';

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

  let metrics = data.metrics;
  if (data.status === 'completed' && metrics) {
    const m = metrics as unknown as Record<string, number>;
    const values = Object.values(m).filter(
      (v): v is number => typeof v === 'number',
    );
    if (values.length > 0) {
      const avgScore = values.reduce((a, b) => a + b, 0) / values.length;
      (m as Record<string, unknown>).avgScore = avgScore;
      metrics = m as unknown as JobMetrics;
    }
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: new Date(),
    ...(metrics && { metrics }),
  };

  if (data.status === 'completed' && metrics) {
    const m = metrics as unknown as Record<string, number>;
    if (typeof m.totalTokens === 'number') {
      updateData.tokensUsed = m.totalTokens;
    }
    if (typeof m.costUSD === 'number') {
      updateData.costUsd = m.costUSD;
    }
  }

  const result = await db
    .update(jobs)
    .set(updateData)
    .where(eq(jobs.id, id))
    .returning();

  const job = result[0];

  if (data.status) {
    if (data.status === 'completed') {
      const duration = job.updatedAt.getTime() - job.createdAt.getTime();
      log.jobCompleted(id, duration, {
        provider: job.provider,
        model: job.model,
      });
    } else if (data.status === 'failed') {
      log.jobFailed(id, new Error(data.errorMessage || 'Unknown error'), {
        provider: job.provider,
        model: job.model,
      });
    } else if (data.status === 'running') {
      log.jobStarted(id, { provider: job.provider, model: job.model });
    }
  }

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
  cost_usd: number | null;
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
      cost_usd: jobs.costUsd,
      metrics: jobs.metrics,
    })
    .from(jobs);

  const finalQuery =
    conditions.length > 0 ? baseQuery.where(and(...conditions)) : baseQuery;

  const rows = await finalQuery
    .orderBy(desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    provider: row.provider,
    model: row.model,
    cost_usd: row.cost_usd,
    avgScore:
      row.metrics &&
      typeof (row.metrics as Record<string, any>).avgScore === 'number'
        ? (row.metrics as Record<string, number>).avgScore
        : null,
  }));
}
