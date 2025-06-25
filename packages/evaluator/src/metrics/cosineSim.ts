import { encoding_for_model } from '@dqbd/tiktoken';
import type { Metric } from '../types.js';

function vector(text: string): number[] {
  const enc = encoding_for_model('gpt2');
  const tokens = enc.encode(text);
  enc.free();
  const n = tokens.length || 1;
  return Array.from(tokens, (t) => t / n);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
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

const cosineSim: Metric = {
  async evaluate({ prediction, references }) {
    const predVec = vector(prediction);
    const scores = references.map((r) => cosineSimilarity(predVec, vector(r)));
    return { score: Math.max(...scores) };
  },
};

export default cosineSim;
