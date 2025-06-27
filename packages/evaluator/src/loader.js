import pLimit from 'p-limit';
import { calculateCosineSimilarity } from './utils.js';
async function exactMatch(_openai, { prediction, reference }) {
  return prediction.trim() === reference.trim() ? 1 : 0;
}
async function cosineSim(openai, { prediction, reference }) {
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
const metricMap = {
  exactMatch,
  cosineSim,
};
export function discoverMetrics() {
  return new Map(Object.entries(metricMap));
}
export async function runMetric(name, openai, items, concurrency = 5) {
  const metric = metricMap[name];
  if (!metric) {
    throw new Error(`Unknown metric: ${name}`);
  }
  const limit = pLimit(concurrency);
  return Promise.all(items.map((it) => limit(() => metric(openai, it))));
}
