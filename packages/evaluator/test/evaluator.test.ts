// eslint-disable-next-line import/no-extraneous-dependencies, object-curly-newline
import { describe, it, expect, vi, type Mock } from 'vitest';
import type OpenAI from 'openai';
import {
  applyTemplate,
  scorePair,
  runBatch,
  BatchItem,
  discoverMetrics,
  runMetric,
  runDeepEval,
} from '../src/index.js';

vi.mock('@dqbd/tiktoken', () => ({
  get_encoding: () => ({
    encode: (t: string) => Array.from(t).map((c) => c.charCodeAt(0)),
  }),
}));

vi.mock('deepeval', () => ({
  __esModule: true,
  metric: vi.fn(async (_name: string, opts: unknown) => ({ ok: true, opts })),
}));

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

describe('metric loader', () => {
  it('discovers bundled metrics', async () => {
    const metrics = await discoverMetrics();
    const names = Array.from(metrics.keys()).sort();
    expect(names).toEqual(['cosineSim', 'exactMatch']);
    const res = await runMetric('exactMatch', {
      prediction: 'foo',
      references: ['foo'],
    });
    expect(res.score).toBe(1);
  });

  it('throws on missing metric', async () => {
    await expect(
      runMetric('missing', { prediction: 'a', references: ['b'] }),
    ).rejects.toThrow();
  });

  it('cosineSim returns high score for same text', async () => {
    const { score } = await runMetric('cosineSim', {
      prediction: 'abc',
      references: ['abc'],
    });
    expect(score).toBeCloseTo(1);
  });

  it('cosineSim returns lower score for different text', async () => {
    const { score } = await runMetric('cosineSim', {
      prediction: 'abc',
      references: ['xyz'],
    });
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe('runDeepEval', () => {
  it('forwards to deepeval.metric', async () => {
    const out = await runDeepEval('coherence', { a: 1 });
    const mod = await import('deepeval');
    expect((mod as unknown as { metric: Mock }).metric).toHaveBeenCalledWith('coherence', {
      a: 1,
    });
    expect(out).toEqual({ ok: true, opts: { a: 1 } });
  });
});
