export const PRICING = {
  openai: {
    'gpt-4.1-nano': 0.001,
    'gpt-4.1-mini': 0.003,
    'gpt-4.1': 0.01,
    'gpt-4o-mini': 0.002,
  },
  gemini: {
    'gemini-2.5-flash': 0.00025,
  },
} as const;

export type ProviderPricing = typeof PRICING;
