import type { Server } from 'http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { app } from '../src/index.js';

let server: Server;
let request: supertest.SuperTest<supertest.Test>;
let originalOpenAIKey: string | undefined;

beforeAll(async () => {
  // Preserve the original OpenAI API key
  originalOpenAIKey = process.env.OPENAI_API_KEY;

  // Set test environment variables - only override Gemini, keep real OpenAI key
  process.env.GEMINI_API_KEY = 'test-key-for-e2e';

  const port = await getPort();
  server = app.listen(port);
  request = supertest(app);
});

afterAll(async () => {
  // Restore the original OpenAI API key
  if (originalOpenAIKey) {
    process.env.OPENAI_API_KEY = originalOpenAIKey;
  }

  if (server) {
    server.close();
  }
});

describe('Jobs E2E Flow', () => {
  it('should create and stream a job end-to-end', async () => {
    // 1. Create a job with OpenAI using cheap gpt-4.1-mini for testing
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Write just the word "test"',
        provider: 'openai',
        model: 'gpt-4.1-mini',
      })
      .expect(202);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.prompt).toBe('Write just the word "test"');
    expect(createResponse.body.provider).toBe('openai');
    expect(createResponse.body.model).toBe('gpt-4.1-mini');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // 2. Stream the job completion
    const streamResponse = await request
      .get(`/jobs/${jobId}/stream`)
      .expect(200);

    expect(streamResponse.headers['content-type']).toBe('text/event-stream');

    // Verify we got some content from the streaming endpoint
    expect(streamResponse.text.length).toBeGreaterThan(0);
    expect(streamResponse.text).toContain('data:');

    // Should contain either successful token events or error events
    const hasTokens = streamResponse.text.includes('"token"');
    const hasError = streamResponse.text.includes('"error"');
    expect(hasTokens || hasError).toBe(true);

    // If successful, should contain metrics event
    if (hasTokens) {
      expect(streamResponse.text).toContain('event: metrics');
    }
  }, 15000); // Increase timeout for real OpenAI streaming
});
