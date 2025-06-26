import OpenAI from 'openai';
import type { LLMProvider, ProviderOptions } from './index.js';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

async function* complete(
  prompt: string,
  options: ProviderOptions,
): AsyncGenerator<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error('OpenAI API key not configured. Cannot process request.');
  }

  const stream = await openai.chat.completions.create({
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export const OpenAIProvider: LLMProvider = {
  name: 'openai',
  models: ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  complete,
};
