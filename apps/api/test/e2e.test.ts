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

describe('E2E /eval', () => {
  it('runs evaluation and checks avgCosSim', async () => {
    // ARRANGE: Ensure API key is available (default state)
    mockConfig.openai.apiKey = 'sk-test-mock-openai-key';

    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4o-mini',
      testSetId: 'news-summaries',
    });

    // ASSERT: Should return successful evaluation with aggregates
    expect(res.status).toBe(200);
    expect(res.body.aggregates.avgCosSim).toBeGreaterThanOrEqual(0.7);
  });
});
