import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ServiceUnavailableError } from '../errors/ApiError.js';

export interface EvaluationResult {
  id: string;
  prediction: string;
  reference: string;
  latencyMs: number;
  tokens: number;
  score?: number;
}

export interface EvaluationCase {
  id: string;
  input: string;
  expected: string;
}

export interface EvaluationOptions {
  model: string;
  timeout?: number;
}

/**
 * Simple template application function (inlined to avoid circular dependencies)
 */
function applyTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (match, key) => variables[key] || match,
  );
}

/**
 * Evaluates a single test case using OpenAI
 */
export async function evaluateWithOpenAI(
  promptTemplate: string,
  testCase: EvaluationCase,
  options: EvaluationOptions = { model: 'gpt-4o-mini' },
): Promise<EvaluationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ServiceUnavailableError('OpenAI API key not configured');
  }

  const timeout =
    options.timeout ||
    (process.env.OPENAI_TIMEOUT_MS
      ? parseInt(process.env.OPENAI_TIMEOUT_MS, 10)
      : 15000);

  const openai = new OpenAI({
    apiKey,
    timeout,
  });

  const prompt = applyTemplate(promptTemplate, { input: testCase.input });
  const start = Date.now();

  const resp = await openai.chat.completions.create({
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
  });

  const latencyMs = Date.now() - start;
  const completion = resp.choices[0]?.message?.content || '';
  const tokens = resp.usage?.total_tokens ?? 0;

  return {
    id: testCase.id,
    prediction: completion,
    reference: testCase.expected,
    latencyMs,
    tokens,
  };
}

/**
 * Evaluates a single test case using Gemini
 */
export async function evaluateWithGemini(
  promptTemplate: string,
  testCase: EvaluationCase,
  options: EvaluationOptions = { model: 'gemini-pro' },
): Promise<EvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the server');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: options.model });

  const prompt = applyTemplate(promptTemplate, { input: testCase.input });
  const start = Date.now();

  const controller = new AbortController();
  const timeout =
    options.timeout ||
    (process.env.GEMINI_TIMEOUT_MS
      ? parseInt(process.env.GEMINI_TIMEOUT_MS, 10)
      : 15000);
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await model.generateContent(prompt, {
      signal: controller.signal,
    });
    const completion = resp.response.text();
    const latencyMs = Date.now() - start;

    return {
      id: testCase.id,
      prediction: completion,
      reference: testCase.expected,
      latencyMs,
      tokens: 0, // Gemini doesn't provide token count in this interface
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Factory function to get the appropriate evaluator based on model
 */
export function getEvaluator(model: string) {
  if (model.startsWith('gpt-')) {
    return evaluateWithOpenAI;
  } else if (model === 'gemini-2.5-flash' || model.startsWith('gemini-')) {
    return evaluateWithGemini;
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
}
