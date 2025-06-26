import type OpenAI from 'openai';
export interface MetricInput {
  prediction: string;
  reference: string;
}
export type MetricFn = (openai: OpenAI, input: MetricInput) => Promise<number>;
export declare function discoverMetrics(): Map<string, MetricFn>;
export declare function runMetric(
  name: string,
  openai: OpenAI,
  items: MetricInput[],
  concurrency?: number,
): Promise<number[]>;
