import pLimit from 'p-limit';
import { calculateCosineSimilarity } from './utils.js';
import { discoverMetrics, runMetric } from './loader.js';
function applyTemplate(template, vars) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    var _a;
    return (_a = vars[key]) !== null && _a !== void 0 ? _a : '';
  });
}
async function scorePair(
  openai,
  prediction,
  reference,
  model = 'text-embedding-3-small',
) {
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
async function runBatch(openai, items, concurrency = 5) {
  const limit = pLimit(concurrency);
  return Promise.all(
    items.map((it) =>
      limit(() => scorePair(openai, it.prediction, it.reference)),
    ),
  );
}
export { applyTemplate, scorePair, runBatch, discoverMetrics, runMetric };
