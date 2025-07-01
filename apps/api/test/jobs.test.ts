import type { Server } from 'http';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { mockGetProvider, mockJobStore } from './setupTests';
import { app } from '../src/index.ts';
import { resetProviders } from '@prompt-lab/api';

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
});

afterEach(async () => {
  if (server) {
    server.close();
  }
});

describe('Jobs API', () => {
  beforeEach(() => {
    resetProviders();
  });

  it('should reject job creation when provider is missing', async () => {
    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        model: 'gpt-4o-mini',
      })
      .expect(400);

    expect(response.body.error).toBe('provider must be a non-empty string.');
  });

  it('should reject job creation when prompt is missing', async () => {
    const response = await request
      .post('/jobs')
      .send({
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(400);

    expect(response.body.error).toBe('prompt must be a non-empty string.');
  });

  it('should reject job creation when model is missing', async () => {
    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'openai',
      })
      .expect(400);

    expect(response.body.error).toBe('model must be a non-empty string.');
  });

  it('should reject unknown provider', async () => {
    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'unknown',
        model: 'gpt-4o-mini',
      })
      .expect(400);

    expect(response.body.error).toContain("Provider 'unknown' not found");
  });

  it('should reject unsupported model for provider', async () => {
    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'openai',
        model: 'unsupported-model',
      })
      .expect(400);

    expect(response.body.error).toContain(
      "Model 'unsupported-model' not supported by provider 'openai'",
    );
  });

  it('should return 503 when OpenAI API key is missing', async () => {
    // Temporarily remove the OpenAI API key
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(503);

    expect(response.body.error).toContain('OpenAI API key is not configured');

    // Restore the key
    if (originalKey) {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it('should create job successfully with OpenAI', async () => {
    // Skip if no real OpenAI API key available
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = 'sk-test-dummy-key-for-mock-testing';
    }

    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    expect(response.body).toHaveProperty('id');
    expect(response.body.prompt).toBe('Hello world');
    expect(response.body.provider).toBe('openai');
    expect(response.body.model).toBe('gpt-4o-mini');
    expect(response.body.status).toBe('pending');
  });

  it('should support all OpenAI model variants', async () => {
    if (!process.env.OPENAI_API_KEY) {
      process.env.OPENAI_API_KEY = 'sk-test-dummy-key-for-mock-testing';
    }

    const models = ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'];

    for (const model of models) {
      const response = await request
        .post('/jobs')
        .send({
          prompt: 'Test prompt',
          provider: 'openai',
          model,
        })
        .expect(202);

      expect(response.body.model).toBe(model);
      expect(response.body.provider).toBe('openai');
    }
  });

  it('should stream OpenAI job completion', async () => {
    // Skip this test if no real OpenAI API key is available
    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY.startsWith('sk-test-')
    ) {
      console.log('Skipping OpenAI streaming test - no API key configured');
      return;
    }

    // Create a job first
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Say hello',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const jobId = createResponse.body.id;

    // Stream the job
    const response = await request.get(`/jobs/${jobId}/stream`).expect(200);

    expect(response.headers['content-type']).toBe('text/event-stream');
    expect(response.text).toContain('data:');
  });

  it('should create job successfully with Gemini (stub)', async () => {
    // Use real Gemini API key if available, otherwise set a dummy one
    if (!process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = 'test-key';
    }

    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      })
      .expect(202);

    expect(response.body).toHaveProperty('id');
    expect(response.body.prompt).toBe('Hello world');
    expect(response.body.provider).toBe('gemini');
    expect(response.body.model).toBe('gemini-2.5-flash');
    expect(response.body.status).toBe('pending');
  });

  it('should return 404 for non-existent job stream', async () => {
    await request.get('/jobs/non-existent-id/stream').expect(404);
  });

  it('should stream Gemini job completion', async () => {
    // Skip this test if no real Gemini API key is available
    if (
      !process.env.GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY === 'test-key'
    ) {
      console.log('Skipping Gemini streaming test - no API key configured');
      return;
    }

    // Create a job first
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
      })
      .expect(202);

    const jobId = createResponse.body.id;

    // Stream the job
    const response = await request.get(`/jobs/${jobId}/stream`).expect(200);

    expect(response.headers['content-type']).toBe('text/event-stream');
    expect(response.text).toContain('data:');
  });

  it('updates job to failed and emits error event on stream failure', async () => {
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'fail test',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    const jobId = createResponse.body.id;

    mockGetProvider.mockImplementationOnce(() => ({
      name: 'openai',
      models: ['gpt-4o-mini'],
      async *stream() {
        yield { content: 'mock chunk' };
        throw new Error('Simulated stream failure');
      },
      complete() {
        throw new Error('stream failure');
      },
    }));

    const response = await request.get(`/jobs/${jobId}/stream`).expect(200);

    expect(response.headers['content-type']).toBe('text/event-stream');
    expect(response.text).toContain('event: error');

    expect(mockJobStore.get(jobId)?.status).toBe('failed');
  });

  it('should stream tokens incrementally (mocked)', async () => {
    // Set the mock provider BEFORE creating the job
    let streamCalled = false;

    // Create job first
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Say hello',
        provider: 'openai',
        model: 'gpt-4o-mini',
      })
      .expect(202);

    // Then mock the provider for the streaming call
    mockGetProvider.mockImplementationOnce(() => ({
      name: 'openai',
      models: ['gpt-4o-mini'],
      async *stream() {
        streamCalled = true;
        yield { content: 'Hello' };
        await new Promise((r) => setTimeout(r, 10));
        yield { content: ' ' };
        await new Promise((r) => setTimeout(r, 10));
        yield { content: 'world!' };
      },
      complete: async () => ({ output: 'Hello world!', tokens: 3, cost: 0 }),
    }));

    const jobId = createResponse.body.id;
    const response = await request.get(`/jobs/${jobId}/stream`).expect(200);
    expect(streamCalled).toBe(true);
    // Should see at least three data events, one per token
    const dataEvents = response.text.match(/data:/g) || [];
    expect(dataEvents.length).toBeGreaterThanOrEqual(3);
    expect(response.text).toContain('Hello');
    expect(response.text).toContain('world!');
  });
});
