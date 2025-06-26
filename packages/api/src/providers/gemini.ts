import type { LLMProvider, ProviderOptions } from './index';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Gemini provider will not be available.');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function* complete(prompt: string, options: ProviderOptions): AsyncGenerator<string> {
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Cannot process request.');
  }
  // This is a stub. Replace with actual Google AI SDK calls.
  const message = 'Response from Gemini stub. ';
  for (const word of message.split(' ')) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network latency
    yield `${word} `;
  }
}

export const GeminiProvider: LLMProvider = {
  name: 'gemini',
  models: ['gemini-2.5-flash'],
  complete,
};
