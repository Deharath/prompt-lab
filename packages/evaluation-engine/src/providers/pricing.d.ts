export declare const PRICING: {
  readonly openai: {
    readonly 'gpt-4.1-nano': 0.00025;
    readonly 'gpt-4.1-mini': 0.001;
    readonly 'gpt-4.1': 0.005;
    readonly 'gpt-4o-mini': 0.000375;
  };
  readonly gemini: {
    readonly 'gemini-2.5-flash': 0;
  };
};
export type ProviderPricing = typeof PRICING;
