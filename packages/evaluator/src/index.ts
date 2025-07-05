import type OpenAI from 'openai';
import pLimit from 'p-limit';
import { calculateCosineSimilarity } from './utils.js';
import { discoverMetrics, runMetric } from './loader.js';

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

  return calculateCosineSimilarity(pred.embedding, ref.embedding);
}

export interface BatchItem {
  prediction: string;
  reference: string;
}

const DEFAULT_CONCURRENCY = 5;

async function runBatch(
  openai: OpenAI,
  items: BatchItem[],
  concurrency = DEFAULT_CONCURRENCY,
): Promise<number[]> {
  const limit = pLimit(concurrency);
  return Promise.all(
    items.map((it) =>
      limit(() => scorePair(openai, it.prediction, it.reference)),
    ),
  );
}

export { applyTemplate, scorePair, runBatch, discoverMetrics, runMetric };
