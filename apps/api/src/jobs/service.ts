import { randomUUID } from 'crypto';
import { db } from '../db/index.js';
import type { Job, NewJob } from '../db/schema.js';

export async function createJob(data: NewJob): Promise<Job> {
  const job: Job = {
    ...data,
    id: randomUUID(),
    status: data.status || 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return db.create(job);
}

export async function getJob(id: string): Promise<Job | undefined> {
  return db.findById(id);
}

export async function updateJob(
  id: string,
  data: Partial<Omit<Job, 'id' | 'createdAt'>>,
): Promise<Job | undefined> {
  return db.update(id, data);
}
