import type { Server } from 'http';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import getPort from 'get-port';
import { app } from '../src/index.js';

// Mock the providers module to use test providers instead of real API calls
vi.mock('../src/providers', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/providers')>();

  async function* mockCompleteSuccess() {
    yield 'Hel';
    yield 'lo';
    yield ' test';
  }

  async function* mockCompleteFailure() {
    yield 'This ';
    throw new Error('Mock provider failed');
  }

  return {
    ...original,
    getProvider: (name: string) => {
      if (name === 'mock-success') {
        return {
          name: 'mock-success',
          models: ['default'],
          complete: mockCompleteSuccess,
        };
      }
      if (name === 'mock-fail') {
        return {
          name: 'mock-fail',
          models: ['default'],
          complete: mockCompleteFailure,
        };
      }
      // Return undefined for unknown providers to avoid real API calls
      return undefined;
    },
  };
});

let server: Server;
let request: supertest.SuperTest<supertest.Test>;

beforeAll(async () => {
  // Set up test environment
  process.env.GEMINI_API_KEY = 'test-key-for-e2e';
  process.env.OPENAI_API_KEY = 'test-key-for-e2e';

  const port = await getPort();
  server = app.listen(port);
  request = supertest(app);
});

afterAll(async () => {
  if (server) {
    server.close();
  }
});

describe('Jobs E2E Flow', () => {
  it('should create and stream a job end-to-end', async () => {
    // 1. Create a job with mock provider for testing
    const createResponse = await request
      .post('/jobs')
      .send({
        prompt: 'Write just the word "test"',
        provider: 'mock-success',
        model: 'default',
      })
      .expect(202);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.prompt).toBe('Write just the word "test"');
    expect(createResponse.body.provider).toBe('mock-success');
    expect(createResponse.body.model).toBe('default');
    expect(createResponse.body.status).toBe('pending');

    const jobId = createResponse.body.id;

    // 2. Stream the job completion
    const streamResponse = await request
      .get(`/jobs/${jobId}/stream`)
      .expect(200);

    expect(streamResponse.headers['content-type']).toBe('text/event-stream');

    // Verify we got the expected streaming content
    expect(streamResponse.text.length).toBeGreaterThan(0);
    expect(streamResponse.text).toContain('data:');

    // Parse the events from the stream
    const events = streamResponse.text.split('\n\n').filter(Boolean);

    // Should contain token events and metrics
    expect(events).toHaveLength(4); // 3 tokens + 1 metrics
    expect(events[0]).toBe('data: {"token":"Hel"}');
    expect(events[1]).toBe('data: {"token":"lo"}');
    expect(events[2]).toBe('data: {"token":" test"}');
    expect(events[3]).toMatch(
      /^event: metrics\ndata: {"durationMs":\d+,"tokenCount":2}$/,
    );
  });
});
