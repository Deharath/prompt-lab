/* eslint-disable import/extensions */
// eslint-disable-next-line import/no-extraneous-dependencies, object-curly-newline
import { describe, it, expect, vi, type Mock } from 'vitest';
import type OpenAI from 'openai';
// eslint-disable-next-line object-curly-newline
import {
  applyTemplate,
  scorePair,
  runBatch,
  discoverMetrics,
  runMetric,
  type BatchItem,
} from '../src/index.js';
// eslint-disable-next-line import/extensions
import exactMatch from '../src/metrics/exactMatch.js';
// eslint-disable-next-line import/extensions
import cosineSim from '../src/metrics/cosineSim.js';

class MockOpenAI {
  embeddings = {
    create: vi.fn(async ({ input }: { input: string }) => {
      const vec = this.map[input as keyof typeof this.map] || [0, 0];
      return { data: [{ embedding: vec }] } as {
        data: { embedding: number[] }[];
      };
    }),
  };

  constructor(private map: Record<string, number[]>) {}
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
    const expected = 1 / Math.sqrt(5); // dot=1, |a|=sqrt(5), |b|=1
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
          setTimeout(resolve, 10);
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

    const scores = await runBatch(openai, items, 1);

    expect(scores).toEqual([1, 1]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
    expect(calls).toHaveLength(4); // 2 items * 2 calls each
  });
});

describe('metrics', () => {
  it('discovers built-in metrics', () => {
    const metrics = discoverMetrics();
    expect([...metrics.keys()].sort()).toEqual(['cosineSim', 'exactMatch']);
  });

  it('runs exactMatch metric', async () => {
    const res = await runMetric('exactMatch', {
      prediction: 'foo',
      references: ['bar', 'foo'],
    });
    expect(res.score).toBe(1);
  });

  it('runs cosineSim metric', async () => {
    const res = await runMetric('cosineSim', {
      prediction: 'hello world',
      references: ['hello there'],
    });
    expect(res.score).toBeGreaterThan(0);
    expect(res.score).toBeLessThanOrEqual(1);
  });

  it('direct metric modules work', async () => {
    const em = await exactMatch.evaluate({ prediction: 'a', references: ['b', 'a'] });
    expect(em.score).toBe(1);
    const cs = await cosineSim.evaluate({ prediction: 'hi', references: ['hello'] });
    expect(cs.score).toBeGreaterThan(0);
  });

  it('throws on missing metric', async () => {
    await expect(
      runMetric('missing', { prediction: 'a', references: ['b'] }),
    ).rejects.toThrow('Metric not found');
  });
});
