export const PRICING = {
  openai: {
    // Updated prices per 1K tokens with separate input/output rates
    'gpt-4.1-nano': { input: 0.0001, output: 0.0004 }, // $0.10/$0.40 per 1M
    'gpt-4.1-mini': { input: 0.0004, output: 0.0016 }, // $0.40/$1.60 per 1M  
    'gpt-4.1': { input: 0.002, output: 0.008 }, // $2.00/$8.00 per 1M
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.60 per 1M
    'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/$10.00 per 1M
    'gpt-4-turbo': { input: 0.01, output: 0.03 }, // $10.00/$30.00 per 1M
  },
  gemini: {
    'gemini-2.5-flash': { input: 0, output: 0 }, // Free tier
    'gemini-1.5-pro': { input: 0.00125, output: 0.005 }, // $1.25/$5.00 per 1M
  },
  anthropic: {
    'claude-3-5-haiku-20241022': { input: 0.0008, output: 0.004 }, // $0.80/$4.00 per 1M
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 }, // $3.00/$15.00 per 1M
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 }, // $15.00/$75.00 per 1M
  },
} as const;

export type ProviderPricing = typeof PRICING;
