import { randomUUID } from 'crypto';
import { db, getDb } from '../db/index.js';
import { jobs, Job, NewJob } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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

  const updateData = {
    ...data,
    updatedAt: new Date(),
    // Ensure metrics is properly serialized
    ...(data.metrics && { metrics: JSON.stringify(data.metrics) }),
  };

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
