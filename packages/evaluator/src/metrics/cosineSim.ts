import type { Metric } from '../types.js';

let encoder: { encode(text: string): number[] } | null = null;

async function embed(text: string): Promise<number> {
  if (!encoder) {
    const mod = await import('@dqbd/tiktoken');
    encoder = mod.get_encoding('cl100k_base');
  }
  const tokens = encoder.encode(text);
  if (tokens.length === 0) return 0;
  return tokens.reduce((sum: number, t: number) => sum + t, 0) / tokens.length;
}

function cosine(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  const cos = (a * b) / (Math.sqrt(a * a) * Math.sqrt(b * b));
  return (cos + 1) / 2;
}

const cosineSim: Metric = {
  async evaluate({ prediction, references }) {
    const predVec = await embed(prediction);
    const vals = await Promise.all(
      references.map(async (ref: string) => cosine(predVec, await embed(ref))),
    );
    return { score: Math.max(...vals) };
  },
};

export default cosineSim;
