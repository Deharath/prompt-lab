import type { Server } from 'http';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { app } from '../src/index.js';
import { db } from '../src/db/index.js';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

beforeEach(async () => {
  // Clean up jobs table before each test
  try {
    await db.deleteAll();
  } catch (_error) {
    // Ignore errors
  }

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
  it('should reject job creation when provider is missing', async () => {
    const response = await request
      .post('/jobs')
      .send({
        prompt: 'Hello world',
        model: 'gpt-4',
      })
      .expect(400);

    expect(response.body.error).toBe('provider must be a non-empty string.');
  });

  it('should reject job creation when prompt is missing', async () => {
    const response = await request
      .post('/jobs')
      .send({
        provider: 'openai',
        model: 'gpt-4',
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
        model: 'gpt-4',
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
    // Use real Gemini API key if available, otherwise set a dummy one
    if (!process.env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = 'test-key';
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
});
