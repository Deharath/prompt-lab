import OpenAI from 'openai';
import type { LLMProvider, ProviderOptions } from './index.js';
import { PRICING } from './pricing.js';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

async function complete(
  prompt: string,
  options: ProviderOptions,
): Promise<{ output: string; tokens: number; cost: number }> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured. Cannot process request.');
  }

  const resp = await openai.chat.completions.create({
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
  });

  const output = resp.choices[0]?.message?.content ?? '';
  const tokens = resp.usage?.total_tokens ?? 0;
  const pricePerK =
    PRICING.openai[options.model as keyof typeof PRICING.openai] ?? 0;
  const cost = (tokens / 1000) * pricePerK;

  return { output, tokens, cost };
}

export const OpenAIProvider: LLMProvider = {
  name: 'openai',
  models: ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  complete,
};
