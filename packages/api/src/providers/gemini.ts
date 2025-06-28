import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, ProviderOptions } from './index.js';
import { PRICING } from './pricing.js';

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
    const tokens = (resp as any).usageStats?.totalTokens || 0;
    const pricePerK =
      PRICING.gemini[options.model as keyof typeof PRICING.gemini] ?? 0;
    const cost = (tokens / 1000) * pricePerK;

    return { output, tokens, cost };
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

export const GeminiProvider: LLMProvider = {
  name: 'gemini',
  models: [
    'gemini-2.5-flash', // Latest and most cost-effective flash model
  ],
  complete,
};
