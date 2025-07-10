import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, ProviderOptions } from './index.js';
import { PRICING } from './pricing.js';

import { getGeminiTokenCount } from '../jobs/helpers.js';
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

async function complete(
  prompt: string,
  options: ProviderOptions,
): Promise<{ output: string; tokens: number; cost: number }> {
  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error('Gemini API key not configured. Cannot process request.');
  }

  const model = genAI.getGenerativeModel({
    model: options.model,
  });

  try {
    const resp = await model.generateContent(prompt);
    const output = resp.response.text();
    const tokens = getGeminiTokenCount(resp);
    const pricing = PRICING.gemini[options.model as keyof typeof PRICING.gemini];
    // Gemini free tier - approximate input/output split (most tokens are typically input)
    const inputTokens = Math.floor(tokens * 0.8);
    const outputTokens = tokens - inputTokens;
    const cost = pricing
      ? (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output
      : 0;

    return { output, tokens, cost };
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

async function* stream(
  prompt: string,
  options: ProviderOptions,
): AsyncGenerator<{ content: string; isFinal?: boolean }, void, unknown> {
  // For better streaming, let's stream word by word instead of sentence by sentence
  const { output } = await complete(prompt, options);
  const words = output.split(/(\s+)/); // Split by whitespace, preserving spaces
  for (const word of words) {
    if (word) {
      yield { content: word };
      // Simulate delay for realism (remove or adjust as needed)
      await new Promise((r) => setTimeout(r, 20));
    }
  }
}

export const GeminiProvider: LLMProvider = {
  name: 'gemini',
  models: [
    'gemini-2.5-flash', // Latest and most cost-effective flash model
  ],
  complete,
  stream,
};
