import { OpenAIProvider } from './openai';
import { GeminiProvider } from './gemini';

export interface ProviderOptions {
  model: string;
  // Future options: temperature, max_tokens, etc.
}

export interface LLMProvider {
  name: string;
  models: string[];
  complete(prompt: string, options: ProviderOptions): AsyncGenerator<string>;
}

const providers: Record<string, LLMProvider> = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
};

export function getProvider(name: string): LLMProvider | undefined {
  return providers[name];
}
