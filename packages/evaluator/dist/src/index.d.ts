import type OpenAI from 'openai';
export type { Metric, MetricArgs, MetricResult } from './types.js';
export { discoverMetrics, runMetric } from './loader.js';
declare function applyTemplate(template: string, vars: Record<string, string>): string;
declare function scorePair(openai: OpenAI, prediction: string, reference: string, model?: string): Promise<number>;
export interface BatchItem {
    prediction: string;
    reference: string;
}
declare function runBatch(openai: OpenAI, items: BatchItem[], concurrency?: number): Promise<number[]>;
export { applyTemplate, scorePair, runBatch };
