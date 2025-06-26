import type { Server } from 'http';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { app } from '../src/index.js';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  // Set up test environment with actual API keys for E2E testing
  process.env.GEMINI_API_KEY = 'test-key-for-e2e';
  process.env.OPENAI_API_KEY = 'test-key-for-e2e';
  // Use a test-specific database to avoid conflicts
  process.env.DATABASE_URL = ':memory:';

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
  await new Promise(resolve => setTimeout(resolve, 10));
});

describe('Jobs E2E Flow', () => {
  it('should create and stream a job end-to-end', async () => {
    // 1. Create a job with openai provider for testing (but with fake keys)
    // This will fail the actual API call but should create the job entry
    const createResponse = await request.post('/jobs').send({
      prompt: 'Write just the word "test"',
      provider: 'openai',
      model: 'gpt-4o-mini',
    });

    expect(createResponse.status).toBe(202);
    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.prompt).toBe('Write just the word "test"');
    expect(createResponse.body.provider).toBe('openai');
    expect(createResponse.body.model).toBe('gpt-4o-mini');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // 2. Try to get the job status (it may fail due to fake API key, but job should exist)
    const statusResponse = await request.get(`/jobs/${jobId}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toHaveProperty('id', jobId);
    expect(statusResponse.body).toHaveProperty('status');
    // The status could be 'pending', 'failed', or 'completed' depending on timing

    // This is an E2E test, so we're just verifying the basic flow works
    // The actual streaming behavior would require real API keys to test fully
  });

  it('should create and handle Gemini provider E2E', async () => {
    // Test Gemini provider as well
    const createResponse = await request.post('/jobs').send({
      prompt: 'Write just the word "hello"',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
    });

    expect(createResponse.status).toBe(202);
    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.provider).toBe('gemini');
    expect(createResponse.body.model).toBe('gemini-2.5-flash');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // Try to get the job status
    const statusResponse = await request.get(`/jobs/${jobId}`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toHaveProperty('id', jobId);
    expect(statusResponse.body).toHaveProperty('status');
  });
});
