import OpenAI from 'openai';
import { LLMProvider, ProviderOptions } from './index';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. OpenAI provider will not be available.');
}

const openai = apiKey ? new OpenAI({ apiKey }) : null;

async function* complete(prompt: string, options: ProviderOptions): AsyncGenerator<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Cannot process request.');
  }

  const stream = await openai.chat.completions.create({
    model: options.model,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export const OpenAIProvider: LLMProvider = {
  name: 'openai',
  models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo-preview'],
  complete,
};
