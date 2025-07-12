// Import pricing from shared-types
import { PRICING } from '@prompt-lab/shared-types';

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
type TiktokenModule = typeof import('tiktoken');
type Tiktoken = ReturnType<TiktokenModule['get_encoding']>;
type TiktokenEncoding = import('tiktoken').TiktokenEncoding;

// Lazy loading of tiktoken to handle WASM loading issues
let tiktokenPromise: Promise<TiktokenModule | null> | null = null;
const encodingCache: Map<string, Tiktoken> = new Map();

async function getTiktoken() {
  if (!tiktokenPromise) {
    tiktokenPromise = (async () => {
      try {
        const tiktoken = await import('tiktoken');
        return tiktoken;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(
            'Failed to load tiktoken WASM, falling back to approximation:',
            error,
          );
        }
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
    if (import.meta.env.DEV) {
      console.warn(`Failed to get encoding ${encoding}:`, error);
    }
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
      if (import.meta.env.DEV) {
        console.warn('Error using cached encoding:', error);
      }
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
    if (import.meta.env.DEV) {
      console.warn('Failed to count tokens with tiktoken:', error);
    }
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
    if (import.meta.env.DEV) {
      console.warn(
        'Failed to count chat tokens, falling back to approximation:',
        error,
      );
    }
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
  // Map model name to pricing structure from shared pricing
  const modelToPricing = (model: string) => {
    // Try OpenAI first
    if (PRICING.openai[model as keyof typeof PRICING.openai]) {
      const rates = PRICING.openai[model as keyof typeof PRICING.openai];
      return { input: rates.input * 1000, output: rates.output * 1000 }; // Convert from per 1K to per 1M
    }

    // Try Anthropic
    if (PRICING.anthropic[model as keyof typeof PRICING.anthropic]) {
      const rates = PRICING.anthropic[model as keyof typeof PRICING.anthropic];
      return { input: rates.input * 1000, output: rates.output * 1000 };
    }

    // Try Gemini
    if (PRICING.gemini[model as keyof typeof PRICING.gemini]) {
      const rates = PRICING.gemini[model as keyof typeof PRICING.gemini];
      return { input: rates.input * 1000, output: rates.output * 1000 };
    }

    // Fallback to gpt-4o-mini pricing
    const fallback = PRICING.openai['gpt-4o-mini'];
    return { input: fallback.input * 1000, output: fallback.output * 1000 };
  };

  const modelPricing = modelToPricing(model);
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
          if (import.meta.env.DEV) {
            console.warn(`Failed to preload encoding ${encoding}:`, error);
          }
        }
      }),
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to preload tokenizers:', error);
    }
  }
}
