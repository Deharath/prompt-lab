export interface ProviderOptions {
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
}
export interface ProviderStreamChunk {
  content: string;
  isFinal?: boolean;
  [key: string]: unknown;
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
  ): Promise<{
    output: string;
    tokens: number;
    cost: number;
  }>;
  /**
   * Streams output as it is generated. Preferred for real-time UIs.
   * If not implemented, the router will fallback to complete().
   */
  stream?: (
    prompt: string,
    options: ProviderOptions,
  ) => AsyncGenerator<ProviderStreamChunk, void, unknown>;
}
export declare function getProvider(name: string): LLMProvider | undefined;
export declare function setProvider(name: string, provider: LLMProvider): void;
export declare function resetProviders(): void;
