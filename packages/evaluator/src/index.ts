import type OpenAI from 'openai';
import pLimit from 'p-limit';

export type { Metric, MetricArgs, MetricResult } from './types.js';
export { discoverMetrics, runMetric } from './loader.js';

function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(
    /{{\s*(\w+)\s*}}/g,
    (_, key: string) => vars[key] ?? '',
  );
}

async function scorePair(
  openai: OpenAI,
  prediction: string,
  reference: string,
  model = 'text-embedding-3-small',
): Promise<number> {
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

  const a = pred.embedding;
  const b = ref.embedding;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface BatchItem {
  prediction: string;
  reference: string;
}

async function runBatch(
  openai: OpenAI,
  items: BatchItem[],
  concurrency = 5,
): Promise<number[]> {
  const limit = pLimit(concurrency);
  return Promise.all(
    items.map((it) => limit(() => scorePair(openai, it.prediction, it.reference))),
  );
}

export { applyTemplate, scorePair, runBatch };
