export const PRICING = {
  openai: {
    // Prices per 1K tokens (input + output averaged for simplicity)
    'gpt-4.1-nano': 0.00025, // $0.10/$0.40 per 1M = $0.00025 per 1K avg
    'gpt-4.1-mini': 0.001, // $0.40/$1.60 per 1M = $0.001 per 1K avg
    'gpt-4.1': 0.005, // $2.00/$8.00 per 1M = $0.005 per 1K avg
    'gpt-4o-mini': 0.000375, // $0.15/$0.60 per 1M = $0.000375 per 1K avg
  },
  gemini: {
    'gemini-2.5-flash': 0, // Free tier - no cost
  },
  anthropic: {
    // Claude 3.5 Haiku pricing: $0.80/$4.00 per 1M tokens = $0.0024 per 1K avg
    'claude-3-5-haiku-20241022': 0.0024,
  },
} as const;

export type ProviderPricing = typeof PRICING;
