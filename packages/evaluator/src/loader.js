import pLimit from 'p-limit';
async function exactMatch(_openai, { prediction, reference }) {
    return prediction.trim() === reference.trim() ? 1 : 0;
}
async function cosineSim(openai, { prediction, reference }) {
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
