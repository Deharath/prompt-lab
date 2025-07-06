import { describe, it, expect, vi, type Mock } from 'vitest';
import type OpenAI from 'openai';
import { discoverMetrics, runMetric } from '../src/loader.js';

// Constants to avoid magic numbers
const TEST_VECTOR_MAGNITUDE = 5;
const CONCURRENCY_LIMIT = 1;
const DELAY_MS = 10;
const MAX_INFLIGHT_LIMIT = 2;

class MockOpenAI {
  embeddings = {
    create: vi.fn(async ({ input }: { input: string }) => {
      const vec = this._map[input as keyof typeof this._map] || [0, 0];
      return { data: [{ embedding: vec }] } as {
        data: { embedding: number[] }[];
      };
    }),
  };

  constructor(private _map: Record<string, number[]>) {}
}

describe('discoverMetrics', () => {
  it('returns available metric names', () => {
    const metrics = discoverMetrics();
    expect([...metrics.keys()].sort()).toEqual(['cosineSim', 'exactMatch']);
  });
});

describe('runMetric', () => {
  it('executes the exactMatch metric', async () => {
    const openai = {} as OpenAI;
    const items = [
      { prediction: 'yes', reference: 'yes' },
      { prediction: 'no', reference: 'yes' },
    ];
    const scores = await runMetric('exactMatch', openai, items);
    expect(scores).toEqual([1, 0]);
  });

  it('executes the cosineSim metric', async () => {
    const openai = new MockOpenAI({
      a: [1, 2],
      b: [1, 0],
    }) as unknown as OpenAI;
    const scores = await runMetric('cosineSim', openai, [
      { prediction: 'a', reference: 'b' },
    ]);
    const expected = 1 / Math.sqrt(TEST_VECTOR_MAGNITUDE);
    expect(scores[0]).toBeCloseTo(expected);
    expect(
      (openai as unknown as { embeddings: { create: Mock } }).embeddings.create,
    ).toHaveBeenCalledTimes(2);
  });

  it('throws for unknown metric', async () => {
    const openai = {} as OpenAI;
    await expect(runMetric('missing', openai, [])).rejects.toThrow(
      'Unknown metric',
    );
  });

  it('respects concurrency limits', async () => {
    const { openai, items } = setupConcurrencyTest();
    const { maxInFlight } = setupConcurrencyTracking(openai);

    const scores = await runMetric(
      'cosineSim',
      openai,
      items,
      CONCURRENCY_LIMIT,
    );
    expect(scores).toEqual([1, 1]);
    expect(maxInFlight.value).toBeLessThanOrEqual(MAX_INFLIGHT_LIMIT);
  });
});

// Helper function to setup concurrency test data
function setupConcurrencyTest() {
  const openai = new MockOpenAI({
    x: [1, 0],
    y: [1, 0],
  }) as unknown as OpenAI;

  const items = [
    { prediction: 'x', reference: 'y' },
    { prediction: 'x', reference: 'y' },
  ];

  return { openai, items };
}

// Helper function to setup concurrency tracking
function setupConcurrencyTracking(openai: OpenAI) {
  let inFlight = 0;
  const maxInFlight = { value: 0 };

  (
    openai as unknown as { embeddings: { create: Mock } }
  ).embeddings.create.mockImplementation(async () => {
    inFlight += 1;
    maxInFlight.value = Math.max(maxInFlight.value, inFlight);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, DELAY_MS);
    });
    inFlight -= 1;
    return {
      data: [{ embedding: [1, 0] }] as { embedding: number[] }[],
    } as { data: { embedding: number[] }[] };
  });

  return { inFlight, maxInFlight };
}
