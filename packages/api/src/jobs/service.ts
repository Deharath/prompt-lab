import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import { jobs, Job, NewJob } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function createJob(
  data: Omit<NewJob, 'id' | 'status'>,
): Promise<Job> {
  const id = randomUUID();
  const newJob: NewJob = { ...data, id, status: 'pending' };
  const result = await db.insert(jobs).values(newJob).returning();
  return result[0];
}

export async function getJob(id: string): Promise<Job | undefined> {
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function updateJob(
  id: string,
  data: Partial<Omit<Job, 'id' | 'createdAt'>>,
): Promise<Job> {
  const result = await db
    .update(jobs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(jobs.id, id))
    .returning();
  return result[0];
}
