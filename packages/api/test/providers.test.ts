import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EvaluationCase, EvaluationResult } from '@prompt-lab/api';

const mockCreate = vi.fn();
class MockOpenAI {
  chat = { completions: { create: mockCreate } };
  constructor(_opts: unknown) {}
}
vi.mock('openai', () => ({ default: MockOpenAI }));

const mockGenerateContent = vi.fn();
const mockGetModel = vi.fn(() => ({ generateContent: mockGenerateContent }));
class MockGoogleGenerativeAI {
  constructor(_key: string) {}
  getGenerativeModel = mockGetModel;
}
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: MockGoogleGenerativeAI,
}));

let evaluateWithOpenAI: typeof import('@prompt-lab/api').evaluateWithOpenAI;
let evaluateWithGemini: typeof import('@prompt-lab/api').evaluateWithGemini;
let ServiceUnavailableError: typeof import('@prompt-lab/api').ServiceUnavailableError;

beforeEach(async () => {
  vi.resetModules();
  mockCreate.mockReset();
  mockGenerateContent.mockReset();
  mockGetModel.mockReturnValue({ generateContent: mockGenerateContent });
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.GEMINI_API_KEY = 'test-key';
  const api = await import('@prompt-lab/api');
  evaluateWithOpenAI = api.evaluateWithOpenAI;
  evaluateWithGemini = api.evaluateWithGemini;
  ServiceUnavailableError = api.ServiceUnavailableError;
});

describe('evaluateWithOpenAI', () => {
  it('returns evaluation result on success', async () => {
    const response = {
      choices: [{ message: { content: 'hello' } }],
      usage: { total_tokens: 3 },
    };
    mockCreate.mockResolvedValue(response);
    const testCase: EvaluationCase = {
      id: '1',
      input: 'hi',
      expected: 'hello',
    };
    const result: EvaluationResult = await evaluateWithOpenAI(
      'Say {{input}}',
      testCase,
    );
    expect(mockCreate).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: '1',
      prediction: 'hello',
      reference: 'hello',
      tokens: 3,
    });
    expect(typeof result.latencyMs).toBe('number');
  });

  it('throws ServiceUnavailableError when API key missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const testCase: EvaluationCase = {
      id: '1',
      input: 'hi',
      expected: 'hello',
    };
    await expect(
      evaluateWithOpenAI('Say {{input}}', testCase),
    ).rejects.toBeInstanceOf(ServiceUnavailableError);
  });
});

describe('evaluateWithGemini', () => {
  it('returns evaluation result on success', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => 'hey' } });
    const testCase: EvaluationCase = { id: '2', input: 'hi', expected: 'hey' };
    const result: EvaluationResult = await evaluateWithGemini(
      'Say {{input}}',
      testCase,
    );
    expect(mockGetModel).toHaveBeenCalled();
    expect(mockGenerateContent).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: '2',
      prediction: 'hey',
      reference: 'hey',
      tokens: 0,
    });
    expect(typeof result.latencyMs).toBe('number');
  });

  it('throws Error when API key missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const testCase: EvaluationCase = { id: '2', input: 'hi', expected: 'hey' };
    await expect(
      evaluateWithGemini('Say {{input}}', testCase),
    ).rejects.toBeInstanceOf(Error);
  });
});
