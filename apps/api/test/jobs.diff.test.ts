import type { Server } from 'http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import fs from 'node:fs';
import path from 'node:path';
import { mockJobStore, mockGetPreviousJob } from './setupTests';
import { getDb, jobs } from '@prompt-lab/api';
import type { NewJob } from '@prompt-lab/api';
import { app } from '../src/index.ts';

const TEST_DB_PATH = path.join(__dirname, './test-db.sqlite');
process.env.DATABASE_URL = TEST_DB_PATH;

async function seedJobs(jobsToCreate: NewJob[]) {
  const db = await getDb();
  await db.insert(jobs).values(jobsToCreate);
  return jobsToCreate;
}

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

describe('Jobs Diff API', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(async () => {
    const port = await getPort();
    server = app.listen(port);
    request = supertest(app);

    mockGetPreviousJob.mockImplementation(async (currentJobId: string) => {
      const allJobs = Array.from(mockJobStore.values());
      allJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const currentJobIndex = allJobs.findIndex(
        (job) => job.id === currentJobId,
      );
      if (currentJobIndex === -1) return undefined;
      return currentJobIndex > 0 ? allJobs[currentJobIndex - 1] : undefined;
    });
  });

  afterEach(async () => {
    if (server) {
      server.close();
    }
  });
  it('should return 404 when base job is not found', async () => {
    const response = await request
      .get('/jobs/non-existent-id/diff')
      .expect(404);

    expect(response.body.error).toBe('Base job not found');
  });

  it('should return 404 when otherId job is not found', async () => {
    // Create one job first
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Test prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const jobId = createResponse.body.id;

    // Try to diff with non-existent otherId
    const response = await request
      .get(`/jobs/${jobId}/diff?otherId=non-existent-id`)
      .expect(404);

    expect(response.body.error).toBe('Compare job not found');
  });

  it('should compare two jobs when otherId is provided', async () => {
    // Create first job
    const firstJobResponse = await request
      .post('/jobs')
      .send({
        prompt: 'First test prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const firstJobId = firstJobResponse.body.id;

    // Create second job
    const secondJobResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Second test prompt',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      })
      .expect(202);

    const secondJobId = secondJobResponse.body.id;

    // Compare the two jobs
    const diffResponse = await request
      .get(`/jobs/${secondJobId}/diff?otherId=${firstJobId}`)
      .expect(200);

    expect(diffResponse.body).toHaveProperty('baseJob');
    expect(diffResponse.body).toHaveProperty('compareJob');

    // Verify the response structure
    expect(diffResponse.body.baseJob.id).toBe(secondJobId);
    expect(diffResponse.body.compareJob.id).toBe(firstJobId);
    expect(diffResponse.body.baseJob.prompt).toBe('Second test prompt');
    expect(diffResponse.body.compareJob.prompt).toBe('First test prompt');
  });

  it('should return 404 when job has no predecessor and otherId is not provided', async () => {
    // ARRANGE: Create only one job (the first job, with no predecessor)
    const [firstJob] = await seedJobs([
      {
        id: 'first-job',
        prompt: 'First job prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ]);

    mockJobStore.set(firstJob.id, firstJob);

    // ACT: Try to get diff for the first job without specifying otherId
    const response = await supertest(app).get(`/jobs/${firstJob.id}/diff`);

    // ASSERT: Should return 404 since there's no previous job to compare with
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No previous job found to compare with');
  });

  it('should compare with the previous job when otherId is not provided', async () => {
    // ARRANGE: Seed the database directly with two jobs in a known order.
    const [previousJob, baseJob] = await seedJobs([
      {
        id: 'job-1',
        prompt: 'prompt 1',
        provider: 'openai',
        model: 'gpt-4o-mini',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'job-2',
        prompt: 'prompt 2',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        createdAt: new Date('2024-01-01T10:05:00Z'),
      },
    ]);

    mockJobStore.set(previousJob.id, previousJob);
    mockJobStore.set(baseJob.id, baseJob);

    // ACT: Make a SINGLE API call to the endpoint under test.
    const response = await supertest(app).get(`/jobs/${baseJob.id}/diff`);

    // ASSERT: Verify the response is correct and contains the seeded data.
    expect(response.status).toBe(200);
    expect(response.body.baseJob.id).toBe(baseJob.id);
    expect(response.body.compareJob.id).toBe(previousJob.id);
  });

  it('should return complete job objects with all properties', async () => {
    // Create two jobs
    const firstJobResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Job 1 prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const secondJobResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Job 2 prompt',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const diffResponse = await request
      .get(
        `/jobs/${secondJobResponse.body.id}/diff?otherId=${firstJobResponse.body.id}`,
      )
      .expect(200);

    // Verify all expected properties are present
    const { baseJob, compareJob } = diffResponse.body;

    // Base job properties
    expect(baseJob).toHaveProperty('id');
    expect(baseJob).toHaveProperty('prompt');
    expect(baseJob).toHaveProperty('provider');
    expect(baseJob).toHaveProperty('model');
    expect(baseJob).toHaveProperty('status');
    expect(baseJob).toHaveProperty('createdAt');
    expect(baseJob).toHaveProperty('updatedAt');

    // Compare job properties
    expect(compareJob).toHaveProperty('id');
    expect(compareJob).toHaveProperty('prompt');
    expect(compareJob).toHaveProperty('provider');
    expect(compareJob).toHaveProperty('model');
    expect(compareJob).toHaveProperty('status');
    expect(compareJob).toHaveProperty('createdAt');
    expect(compareJob).toHaveProperty('updatedAt');
  });
});
