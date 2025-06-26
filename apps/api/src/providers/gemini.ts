import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, ProviderOptions } from './index.js';

function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

async function* complete(
  prompt: string,
  options: ProviderOptions,
): AsyncGenerator<string> {
  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error('Gemini API key not configured. Cannot process request.');
  }

  const model = genAI.getGenerativeModel({
    model: options.model,
    generationConfig: {
      // Disable thinking for faster responses and lower costs
      // Note: This is conceptual - actual implementation may vary
    },
  });

  try {
    const result = await model.generateContentStream(prompt);

    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

const GeminiProvider: LLMProvider = {
  name: 'gemini',
  models: [
    'gemini-2.5-flash', // Latest and most cost-effective flash model
  ],
  complete,
};

export default GeminiProvider;
