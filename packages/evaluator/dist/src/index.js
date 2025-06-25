import pLimit from 'p-limit';
export { discoverMetrics, runMetric } from './loader.js';
function applyTemplate(template, vars) {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => { var _a; return (_a = vars[key]) !== null && _a !== void 0 ? _a : ''; });
}
async function scorePair(openai, prediction, reference, model = 'text-embedding-3-small') {
    const [{ data: [pred], }, { data: [ref], },] = await Promise.all([
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
async function runBatch(openai, items, concurrency = 5) {
    const limit = pLimit(concurrency);
    return Promise.all(items.map((it) => limit(() => scorePair(openai, it.prediction, it.reference))));
}
export { applyTemplate, scorePair, runBatch };
