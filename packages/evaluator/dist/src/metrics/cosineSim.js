import { encoding_for_model } from '@dqbd/tiktoken';
function vector(text) {
    const enc = encoding_for_model('gpt2');
    const tokens = enc.encode(text);
    enc.free();
    const n = tokens.length || 1;
    return Array.from(tokens, (t) => t / n);
}
function cosineSimilarity(a, b) {
    var _a, _b;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
        const x = (_a = a[i]) !== null && _a !== void 0 ? _a : 0;
        const y = (_b = b[i]) !== null && _b !== void 0 ? _b : 0;
        dot += x * y;
        normA += x * x;
        normB += y * y;
    }
    if (normA === 0 || normB === 0) {
        return 0;
    }
    const cos = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return (cos + 1) / 2;
}
const cosineSim = {
    async evaluate({ prediction, references }) {
        const predVec = vector(prediction);
        const scores = references.map((r) => cosineSimilarity(predVec, vector(r)));
        return { score: Math.max(...scores) };
    },
};
export default cosineSim;
