import { OpenAIProvider } from './openai.js';
import { GeminiProvider } from './gemini.js';
import { AnthropicProvider } from './anthropic.js';

export interface ProviderOptions {
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  requestId?: string;
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
   * Returns the full output at once. Used for batch operations and non-streaming scenarios.
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

// Built-in providers that are always available
const BUILTIN_PROVIDERS = {
  openai: OpenAIProvider,
  gemini: GeminiProvider,
  anthropic: AnthropicProvider,
} as const;

let providers: Record<string, LLMProvider> = { ...BUILTIN_PROVIDERS };

export function getProvider(name: string): LLMProvider | undefined {
  return providers[name];
}

export function setProvider(name: string, provider: LLMProvider) {
  providers[name] = provider;
}

/**
 * Remove a specific provider by name.
 * Built-in providers (openai, gemini, anthropic) cannot be removed.
 */
export function removeProvider(name: string): boolean {
  if (name in BUILTIN_PROVIDERS) {
    return false; // Cannot remove built-in providers
  }

  if (name in providers) {
    delete providers[name];
    return true;
  }

  return false; // Provider not found
}

/**
 * Get list of all registered provider names
 */
export function getProviderNames(): string[] {
  return Object.keys(providers);
}

/**
 * Check if a provider is a built-in provider
 */
export function isBuiltinProvider(name: string): boolean {
  return name in BUILTIN_PROVIDERS;
}

/**
 * Reset providers to only built-in ones.
 * WARNING: This removes all custom providers that were added via setProvider().
 * Use removeProvider() to remove individual custom providers instead.
 */
/**
 * Get list of custom (non-built-in) provider names
 */
export function getCustomProviderNames(): string[] {
  return Object.keys(providers).filter((name) => !isBuiltinProvider(name));
}

export function resetProviders() {
  providers = { ...BUILTIN_PROVIDERS };
}
