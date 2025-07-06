import { describe, it, expect, vi, type Mock } from 'vitest';
import type OpenAI from 'openai';
import { applyTemplate, scorePair, runBatch, BatchItem } from '../src/index.js';

// Constants to avoid magic numbers
const TEST_VECTOR_MAGNITUDE = 5;
const CONCURRENCY_LIMIT = 1;
const DELAY_MS = 10;
const EXPECTED_TOTAL_CALLS = 4;

class MockOpenAI {
  embeddings = {
    create: vi.fn(async ({ input }: { input: string }) => {
      const vec = this._map[input] || [0, 0];
      return { data: [{ embedding: vec }] };
    }),
  };

  constructor(private _map: Record<string, number[]>) {}
}

describe('applyTemplate', () => {
  it('replaces placeholders with values', () => {
    const out = applyTemplate('hi {{name}}', { name: 'Sam' });
    expect(out).toBe('hi Sam');
  });
});

describe('scorePair', () => {
  it('computes cosine similarity using embeddings', async () => {
    const openai = new MockOpenAI({
      a: [1, 2],
      b: [1, 0],
    }) as unknown as OpenAI;
    const score = await scorePair(openai, 'a', 'b');
    const expected = 1 / Math.sqrt(TEST_VECTOR_MAGNITUDE); // dot=1, |a|=sqrt(5), |b|=1
    expect(score).toBeCloseTo(expected);
    expect(
      (openai as unknown as { embeddings: { create: Mock } }).embeddings.create,
    ).toHaveBeenCalledTimes(2);
  });
});

describe('runBatch', () => {
  it('respects concurrency limit', async () => {
    const calls: string[] = [];
    const openai = new MockOpenAI({
      x: [1, 0],
      y: [1, 0],
    }) as unknown as OpenAI;
    let inFlight = 0;
    let maxInFlight = 0;
    (
      openai as unknown as { embeddings: { create: Mock } }
    ).embeddings.create.mockImplementation(
      async ({ input }: { input: string }) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, DELAY_MS);
        });
        inFlight -= 1;
        calls.push(input);
        return { data: [{ embedding: [1, 0] }] } as {
          data: { embedding: number[] }[];
        };
      },
    );

    const items: BatchItem[] = [
      { prediction: 'x', reference: 'y' },
      { prediction: 'x', reference: 'y' },
    ];

    const scores = await runBatch(openai, items, CONCURRENCY_LIMIT);

    expect(scores).toEqual([1, 1]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(calls).toHaveLength(EXPECTED_TOTAL_CALLS); // 2 items * 2 calls each
  });
});
