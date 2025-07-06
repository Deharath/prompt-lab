import type OpenAI from 'openai';
import pLimit from 'p-limit';
import { calculateCosineSimilarity } from './utils.js';

export interface MetricInput {
  prediction: string;
  reference: string;
}

export type MetricFn = (
  _openai: OpenAI,
  _input: MetricInput,
) => Promise<number>;

async function exactMatch(
  _openai: OpenAI,
  { prediction, reference }: MetricInput,
): Promise<number> {
  return prediction.trim() === reference.trim() ? 1 : 0;
}

async function cosineSim(
  openai: OpenAI,
  { prediction, reference }: MetricInput,
): Promise<number> {
  const model = 'text-embedding-3-small';
  const [
    {
      data: [pred],
    },
    {
      data: [ref],
    },
  ] = await Promise.all([
    openai.embeddings.create({ model, input: prediction }),
    openai.embeddings.create({ model, input: reference }),
  ]);

  return calculateCosineSimilarity(pred.embedding, ref.embedding);
}

const metricMap: Record<string, MetricFn> = {
  exactMatch,
  cosineSim,
};

export function discoverMetrics(): Map<string, MetricFn> {
  return new Map(Object.entries(metricMap));
}

const DEFAULT_CONCURRENCY = 5;

export async function runMetric(
  name: string,
  openai: OpenAI,
  items: MetricInput[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<number[]> {
  const metric = metricMap[name];
  if (metric === undefined) {
    throw new Error(`Unknown metric: ${name}`);
  }
  const limit = pLimit(concurrency);
  return Promise.all(items.map((it) => limit(() => metric(openai, it))));
}
