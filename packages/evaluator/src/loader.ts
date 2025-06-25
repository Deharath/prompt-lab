import type OpenAI from 'openai';
import pLimit from 'p-limit';

export interface MetricInput {
  prediction: string;
  reference: string;
}

export type MetricFn = (
  openai: OpenAI,
  input: MetricInput,
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
  const [{ data: [pred] }, { data: [ref] }] = await Promise.all([
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

const metricMap: Record<string, MetricFn> = {
  exactMatch,
  cosineSim,
};

export function discoverMetrics(): Map<string, MetricFn> {
  return new Map(Object.entries(metricMap));
}

export async function runMetric(
  name: string,
  openai: OpenAI,
  items: MetricInput[],
  concurrency = 5,
): Promise<number[]> {
  const metric = metricMap[name];
  if (!metric) {
    throw new Error(`Unknown metric: ${name}`);
  }
  const limit = pLimit(concurrency);
  return Promise.all(items.map((it) => limit(() => metric(openai, it))));
}
