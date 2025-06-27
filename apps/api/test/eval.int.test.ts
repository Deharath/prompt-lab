import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { mockConfig } from './setupTests';
import { app } from '../src/index';

let server: ReturnType<typeof app.listen>;

beforeAll(() => {
  server = app.listen(0); // Use port 0 for automatic port assignment
});

afterAll(() => {
  server.close();
});

describe('POST /eval integration', () => {
  it('503 when key missing', async () => {
    // ARRANGE: Simulate a missing API key
    mockConfig.openai.apiKey = undefined as any;

    const res = await request(server).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4o-mini',
      testSetId: 'news-summaries',
    });

    // ASSERT: Should return 503 when API key is missing
    expect(res.status).toBe(503);
  });

  it('500 with JSON when validation fails', async () => {
    // ARRANGE: Send invalid request (missing required fields)
    const res = await request(server).post('/eval').send({});

    // ASSERT: Should return 400 for validation errors
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('evaluates prompt over dataset with key', async () => {
    // ARRANGE: Ensure API key is available (default state)
    mockConfig.openai.apiKey = 'sk-test-mock-openai-key';

    const res = await request(server).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4o-mini',
      testSetId: 'news-summaries',
    });

    // ASSERT: Should return successful evaluation results
    expect(res.status).toBe(200);
    expect(res.body.perItem.length).toBe(15);
    expect(Number.isFinite(res.body.aggregates.avgCosSim)).toBe(true);
  });
});
