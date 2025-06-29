import type { Server } from 'http';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { mockJobStore, mockGetPreviousJob } from './setupTests';
import { app } from '../src/index.ts';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  // Use a test-specific in-memory database to avoid conflicts
  process.env.DATABASE_URL = ':memory:';
});

beforeEach(async () => {
  const port = await getPort();
  server = app.listen(port);
  request = supertest(app);

  // Ensure mock is properly set up for this test
  mockGetPreviousJob.mockImplementation(async (currentJobId: string) => {
    const allJobs = Array.from(mockJobStore.values());
    allJobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const currentJobIndex = allJobs.findIndex((job) => job.id === currentJobId);
    if (currentJobIndex === -1) return undefined;
    return currentJobIndex > 0 ? allJobs[currentJobIndex - 1] : undefined;
  });
});

afterEach(async () => {
  if (server) {
    server.close();
  }
});

describe('Jobs Diff API', () => {
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

  it('should compare with previous job when otherId is not provided', async () => {
    // Test that creates jobs sequentially and verifies the previous job logic
    // by creating two jobs and ensuring they can be diffed without otherId

    const timestamp = Date.now();

    // Create first job
    const job1Response = await request
      .post('/jobs')
      .send({
        prompt: `Job 1 prompt ${timestamp}`,
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const job1Id = job1Response.body.id;

    // Wait to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Create second job (this will be the newer one)
    const job2Response = await request
      .post('/jobs')
      .send({
        prompt: `Job 2 prompt ${timestamp}`,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      })
      .expect(202);

    const job2Id = job2Response.body.id;

    // First, test that we can compare job2 to job1 explicitly (this should work)
    const explicitDiffResponse = await request
      .get(`/jobs/${job2Id}/diff?otherId=${job1Id}`)
      .expect(200);

    expect(explicitDiffResponse.body.baseJob.id).toBe(job2Id);
    expect(explicitDiffResponse.body.compareJob.id).toBe(job1Id);

    // Now test the implicit previous job logic
    // This should find job1 as the previous job to job2
    const implicitDiffResponse = await request
      .get(`/jobs/${job2Id}/diff`)
      .expect(200);

    expect(implicitDiffResponse.body).toHaveProperty('baseJob');
    expect(implicitDiffResponse.body).toHaveProperty('compareJob');
    expect(implicitDiffResponse.body.baseJob.id).toBe(job2Id);
    expect(implicitDiffResponse.body.compareJob.id).toBe(job1Id);
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
