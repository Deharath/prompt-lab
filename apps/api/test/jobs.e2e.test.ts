import type { Server } from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { mockConfig } from './setupTests';
import { app } from '../src/index';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  // ARRANGE: Ensure API keys are available for E2E testing
  mockConfig.openai.apiKey = 'sk-test-mock-openai-key';
  mockConfig.gemini.apiKey = 'sk-test-mock-gemini-key';

  const port = await getPort();
  server = app.listen(port);
  request = supertest(app);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

beforeEach(async () => {
  // Add a small delay between tests for database operations to settle
  await new Promise((resolve) => setTimeout(resolve, 10));
});

describe('Jobs E2E Flow', () => {
  it('should create and stream a job end-to-end', async () => {
    // ARRANGE: Create a job with openai provider
    const createResponse = await request.post('/jobs').send({
      prompt: 'Write just the word "test"',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    // ASSERT: Job should be created successfully
    expect(createResponse.status).toBe(202);
    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.prompt).toBe('Write just the word "test"');
    expect(createResponse.body.provider).toBe('openai');
    expect(createResponse.body.model).toBe('gpt-4o-mini');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // ACT: Try to get the job status
    const statusResponse = await request.get(`/jobs/${jobId}`);

    // ASSERT: Job should exist and have proper status
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toHaveProperty('id', jobId);
    expect(statusResponse.body).toHaveProperty('status');
  });

  it('should create and handle Gemini provider E2E', async () => {
    // ARRANGE & ACT: Test Gemini provider
    const createResponse = await request.post('/jobs').send({
      prompt: 'Write just the word "hello"',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });

    // ASSERT: Gemini job should be created successfully
    expect(createResponse.status).toBe(202);
    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.provider).toBe('gemini');
    expect(createResponse.body.model).toBe('gemini-2.5-flash');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // ACT: Try to get the job status
    const statusResponse = await request.get(`/jobs/${jobId}`);

    // ASSERT: Job should exist and have proper status
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toHaveProperty('id', jobId);
    expect(statusResponse.body).toHaveProperty('status');
  });
});
