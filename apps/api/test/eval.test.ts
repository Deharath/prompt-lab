import request from 'supertest';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import getPort from 'get-port';

// Mock @prompt-lab/api package BEFORE importing the app
// This ensures the mock is applied when the compiled code imports from the package
vi.mock('@prompt-lab/api', async () => {
  // Import the original module to preserve other exports
  const original = (await vi.importActual('@prompt-lab/api')) as any;

  // Create the ServiceUnavailableError class that matches the real implementation
  const ServiceUnavailableError = class extends Error {
    public statusCode: number = 503;
    public code: string = 'SERVICE_UNAVAILABLE';

    constructor(message: string) {
      super(message);
      this.name = 'ServiceUnavailableError';
    }
  };

  // Create mock functions for the evaluation providers
  const mockEvaluateWithOpenAI = vi
    .fn()
    .mockImplementation(async (promptTemplate, testCase, _options) => {
      // Check if API key is missing to simulate real behavior
      if (!process.env.OPENAI_API_KEY) {
        throw new ServiceUnavailableError('OpenAI API key not configured');
      }
      return {
        id: testCase.id,
        prediction: 'mock completion',
        reference: testCase.expected,
        latencyMs: 100,
        tokens: 5,
      };
    });

  const mockEvaluateWithGemini = vi
    .fn()
    .mockImplementation(async (promptTemplate, testCase, _options) => {
      // Check if API key is missing to simulate real behavior
      if (!process.env.GEMINI_API_KEY) {
        throw new ServiceUnavailableError('Gemini API key not configured');
      }
      return {
        id: testCase.id,
        prediction: 'gem',
        reference: testCase.expected,
        latencyMs: 100,
        tokens: 5,
      };
    });

  const mockGetEvaluator = vi.fn().mockImplementation((model: string) => {
    if (model.startsWith('gpt-')) {
      return mockEvaluateWithOpenAI;
    } else if (model === 'gemini-2.5-flash' || model.startsWith('gemini-')) {
      return mockEvaluateWithGemini;
    } else {
      throw new Error(`Unsupported model: ${model}`);
    }
  });

  // Return the original module with mocked evaluation functions
  return {
    ...original,
    evaluateWithOpenAI: mockEvaluateWithOpenAI,
    evaluateWithGemini: mockEvaluateWithGemini,
    getEvaluator: mockGetEvaluator,
    ServiceUnavailableError,
  };
});

// Fallback mocks for direct library usage
vi.mock('openai', () => {
  const mockOpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'mock completion' } }],
          usage: { total_tokens: 5 },
        }),
      },
    },
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: [1, 0] }],
      }),
    },
  }));
  return {
    default: mockOpenAI,
  };
});

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: { text: () => 'gem' },
      }),
    }),
  })),
}));

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

describe('POST /eval', () => {
  it('503 when key missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4.1-mini',
      testSetId: 'news-summaries',
    });

    expect(res.status).toBe(503);
  });

  it('returns evaluation results with key', async () => {
    process.env.OPENAI_API_KEY = 'test';
    const res = await request(`http://localhost:${port}`).post('/eval').send({
      promptTemplate: '{{input}}',
      model: 'gpt-4.1-mini',
      testSetId: 'news-summaries',
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.perItem)).toBe(true);
    expect(res.body.perItem.length).toBe(15);
  });
});
