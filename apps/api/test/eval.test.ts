import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import getPort from 'get-port';
import { mockConfig } from './setupTests';
import { app } from '../src/index';

let server: ReturnType<typeof app.listen>;
let port: number;

beforeAll(async () => {
  port = await getPort();
  server = app.listen(port);
});

afterAll(() => {
  server.close();
});

describe('POST /eval', () => {
  it('503 when key missing', async () => {
    // ARRANGE: Simulate a missing API key
    mockConfig.openai.apiKey = undefined as any;

    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4o-mini',
      testSetId: 'news-summaries',
    });

    // ASSERT: Should return 503 when API key is missing
    expect(res.status).toBe(503);
  });

  it('returns evaluation results with key', async () => {
    // ARRANGE: Ensure API key is available (default state)
    mockConfig.openai.apiKey = 'sk-test-mock-openai-key';

    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4o-mini',
      testSetId: 'news-summaries',
    });

    // ASSERT: Should return successful evaluation results
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.perItem)).toBe(true);
    expect(res.body.perItem.length).toBe(15);
    expect(res.body).toHaveProperty('aggregates');
  });
});
