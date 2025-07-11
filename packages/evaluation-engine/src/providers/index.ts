import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { AnthropicProvider } from './anthropic.js';

export interface ProviderOptions {
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}

export interface ProviderStreamChunk {
  content: string; // The streamed text chunk/token
  isFinal?: boolean; // True if this is the last chunk
  [key: string]: unknown; // For extensibility (e.g., logprobs, etc.)
}

export interface LLMProvider {
  name: string;
  models: string[];
  /**
   * Returns the full output at once (legacy/fallback).
   */
  complete(
    prompt: string,
    options: ProviderOptions,
  ): Promise<{ output: string; tokens: number; cost: number }>;

  /**
   * Streams output as it is generated. Preferred for real-time UIs.
   * If not implemented, the router will fallback to complete().
   */
  stream?: (
    prompt: string,
    options: ProviderOptions,
  ) => AsyncGenerator<ProviderStreamChunk, void, unknown>;
}

let providers: Record<string, LLMProvider> = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
};

export function getProvider(name: string): LLMProvider | undefined {
  return providers[name];
}

export function setProvider(name: string, provider: LLMProvider) {
  providers[name] = provider;
}

export function resetProviders() {
  providers = {
    openai: OpenAIProvider,
    gemini: GeminiProvider,
    anthropic: AnthropicProvider,
  };
}
