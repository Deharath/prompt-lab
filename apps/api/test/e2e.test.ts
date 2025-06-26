import request from 'supertest';

import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import getPort from 'get-port';

vi.mock('openai', () => ({
  default: class {
    chat = {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: 'mock completion' } }],
          usage: { total_tokens: 5 },
        })),
      },
    };
    embeddings = {
      create: vi.fn(async () => ({ data: [{ embedding: [1, 0] }] })),
    };
  },
}));

if (!process.env.GEMINI_API_KEY) {
  vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: vi.fn(async () => ({
            response: { text: () => 'gem' },
          })),
        };
      }
    },
  }));
}

import { app } from '../dist/src/index.js';

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
    process.env.OPENAI_API_KEY = 'test';
    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4.1-mini',
      testSetId: 'news-summaries',
    });
    expect(res.status).toBe(200);
    expect(res.body.aggregates.avgCosSim).toBeGreaterThanOrEqual(0.7);
  });
});
