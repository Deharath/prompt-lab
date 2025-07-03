// Model to encoding map for common OpenAI models
const MODEL_ENCODINGS = {
  'gpt-4': 'cl100k_base',
  'gpt-4-turbo': 'cl100k_base',
  'gpt-4o': 'o200k_base',
  'gpt-4o-mini': 'o200k_base',
  'gpt-3.5-turbo': 'cl100k_base',
  'text-embedding-3-small': 'cl100k_base',
  'text-embedding-3-large': 'cl100k_base',
} as const;

type SupportedModel = keyof typeof MODEL_ENCODINGS;

// Type definitions for tiktoken module
type TiktokenModule = typeof import('@dqbd/tiktoken');
type Tiktoken = ReturnType<TiktokenModule['get_encoding']>;
type TiktokenEncoding = import('@dqbd/tiktoken').TiktokenEncoding;

// Lazy loading of tiktoken to handle WASM loading issues
let tiktokenPromise: Promise<TiktokenModule | null> | null = null;
let encodingCache: Map<string, Tiktoken> = new Map();

async function getTiktoken() {
  if (!tiktokenPromise) {
    tiktokenPromise = (async () => {
      try {
        const tiktoken = await import('@dqbd/tiktoken');
        return tiktoken;
      } catch (error) {
        console.warn(
          'Failed to load tiktoken WASM, falling back to approximation:',
          error,
        );
        return null;
      }
    })();
  }
  return tiktokenPromise;
}

/**
 * Get or create an encoding for a model
 */
async function getEncoding(model: string) {
  const encoding = MODEL_ENCODINGS[model as SupportedModel] || 'cl100k_base';

  if (encodingCache.has(encoding)) {
    return encodingCache.get(encoding);
  }

  try {
    const tiktoken = await getTiktoken();
    if (!tiktoken) return null;

    const enc = tiktoken.get_encoding(encoding as TiktokenEncoding);
    encodingCache.set(encoding, enc);
    return enc;
  } catch (error) {
    console.warn(`Failed to get encoding ${encoding}:`, error);
    return null;
  }
}

/**
 * Count tokens accurately using tiktoken for OpenAI models
 */
export function countTokens(
  text: string,
  model: string = 'gpt-4o-mini',
): number {
  if (!text) return 0;

  // Try to get cached encoding synchronously first
  const encoding = MODEL_ENCODINGS[model as SupportedModel] || 'cl100k_base';
  const cachedEnc = encodingCache.get(encoding);

  if (cachedEnc) {
    try {
      return cachedEnc.encode(text).length;
    } catch (error) {
      console.warn('Error using cached encoding:', error);
    }
  }

  // Fallback to approximation (1 token ≈ 4 characters for most models)
  return Math.ceil(text.length / 4);
}

/**
 * Async version of countTokens for better accuracy when possible
 */
export async function countTokensAsync(
  text: string,
  model: string = 'gpt-4o-mini',
): Promise<number> {
  if (!text) return 0;

  try {
    const enc = await getEncoding(model);
    if (enc) {
      return enc.encode(text).length;
    }
  } catch (error) {
    console.warn('Failed to count tokens with tiktoken:', error);
  }

  // Fallback to approximation
  return Math.ceil(text.length / 4);
}

/**
 * Count tokens for a chat completion request (includes message formatting overhead)
 */
export function countChatTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o-mini',
): number {
  if (!messages || messages.length === 0) return 0;

  try {
    let totalTokens = 0;

    // Count tokens for each message
    for (const message of messages) {
      // Each message has some overhead (role + formatting)
      totalTokens += countTokens(message.content, model);
      totalTokens += countTokens(message.role, model);
      totalTokens += 3; // Overhead per message for formatting
    }

    // Add overhead for the conversation structure
    totalTokens += 3; // Conversation formatting overhead

    return totalTokens;
  } catch (error) {
    console.warn(
      'Failed to count chat tokens, falling back to approximation:',
      error,
    );
    const totalText = messages.map((m) => m.role + m.content).join('');
    return Math.ceil(totalText.length / 4);
  }
}

/**
 * Estimate completion tokens (rough approximation since we don't know the actual output)
 */
export function estimateCompletionTokens(
  prompt: string,
  model: string = 'gpt-4o-mini',
): number {
  const promptTokens = countTokens(prompt, model);
  // Very rough estimate: completion is usually 10-50% of prompt length
  // This is just for display purposes before actual completion
  return Math.ceil(promptTokens * 0.3);
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.round(count / 1000)}k`;
}

/**
 * Calculate estimated cost based on token count and model
 */
export function estimateCost(
  promptTokens: number,
  completionTokens: number,
  model: string,
): number {
  // Pricing per 1M tokens (as of December 2024)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5, output: 10.0 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
  const outputCost = (completionTokens / 1_000_000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * Preload tiktoken encoding for common models to avoid runtime loading delays
 */
export async function preloadTokenizer(
  models: string[] = ['gpt-4o-mini', 'gpt-4o'],
) {
  try {
    const tiktoken = await getTiktoken();
    if (!tiktoken) return;

    // Preload common encodings
    const encodingsToLoad = new Set<string>();
    models.forEach((model) => {
      const encoding =
        MODEL_ENCODINGS[model as SupportedModel] || 'cl100k_base';
      encodingsToLoad.add(encoding);
    });

    await Promise.all(
      Array.from(encodingsToLoad).map(async (encoding) => {
        try {
          const enc = tiktoken.get_encoding(encoding as TiktokenEncoding);
          encodingCache.set(encoding, enc);
        } catch (error) {
          console.warn(`Failed to preload encoding ${encoding}:`, error);
        }
      }),
    );
  } catch (error) {
    console.warn('Failed to preload tokenizers:', error);
  }
}
