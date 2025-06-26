/* eslint-disable max-classes-per-file, @typescript-eslint/lines-between-class-members */
import request from 'supertest';
// eslint-disable-next-line object-curly-newline
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';

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
      // eslint-disable-next-line class-methods-use-this
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

// eslint-disable-next-line import/first
import { app } from '../dist/src/index.js';

let server: ReturnType<typeof app.listen>;

beforeAll(() => {
  server = app.listen(3002);
});

afterAll(() => {
  server.close();
});

describe('POST /eval integration', () => {
  it('503 when key missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await request('http://localhost:3002').post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4.1-mini',
      testSetId: 'news-summaries',
    });

    expect(res.status).toBe(503);
  });

  it('500 with JSON when validation fails', async () => {
    process.env.OPENAI_API_KEY = 'test';
    const res = await request('http://localhost:3002').post('/eval').send({});

    expect(res.status).toBe(500);
    expect(JSON.parse(res.text)).toEqual({ error: 'Internal Server Error' });
  });

  it('evaluates prompt over dataset with key', async () => {
    process.env.OPENAI_API_KEY = 'test';
    const res = await request('http://localhost:3002').post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4.1-mini',
      testSetId: 'news-summaries',
    });

    expect(res.status).toBe(200);
    expect(res.body.perItem.length).toBe(15);
    expect(Number.isFinite(res.body.aggregates.avgCosSim)).toBe(true);
  });
});
