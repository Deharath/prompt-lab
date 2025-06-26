// eslint-disable-next-line import/no-extraneous-dependencies, object-curly-newline
import { describe, it, expect, vi } from 'vitest';
// eslint-disable-next-line object-curly-newline
import { applyTemplate, scorePair, runBatch } from '../src/index.js';
class MockOpenAI {
    constructor(map) {
        this.map = map;
        this.embeddings = {
            create: vi.fn(async ({ input }) => {
                const vec = this.map[input] || [0, 0];
                return { data: [{ embedding: vec }] };
            }),
        };
    }
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
        });
        const score = await scorePair(openai, 'a', 'b');
        const expected = 1 / Math.sqrt(5); // dot=1, |a|=sqrt(5), |b|=1
        expect(score).toBeCloseTo(expected);
        expect(openai.embeddings.create).toHaveBeenCalledTimes(2);
    });
});
describe('runBatch', () => {
    it('respects concurrency limit', async () => {
        const calls = [];
        const openai = new MockOpenAI({
            x: [1, 0],
            y: [1, 0],
        });
        let inFlight = 0;
        let maxInFlight = 0;
        openai.embeddings.create.mockImplementation(async ({ input }) => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            inFlight -= 1;
            calls.push(input);
            return { data: [{ embedding: [1, 0] }] };
        });
        const items = [
            { prediction: 'x', reference: 'y' },
            { prediction: 'x', reference: 'y' },
        ];
        const scores = await runBatch(openai, items, 1);
        expect(scores).toEqual([1, 1]);
        expect(maxInFlight).toBeLessThanOrEqual(2);
        expect(calls).toHaveLength(4); // 2 items * 2 calls each
    });
});
