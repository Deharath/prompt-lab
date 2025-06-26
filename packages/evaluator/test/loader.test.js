// eslint-disable-next-line import/no-extraneous-dependencies, object-curly-newline
import { describe, it, expect, vi } from 'vitest';
import { discoverMetrics, runMetric } from '../src/index.js';
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
describe('discoverMetrics', () => {
    it('returns available metric names', () => {
        const metrics = discoverMetrics();
        expect([...metrics.keys()].sort()).toEqual(['cosineSim', 'exactMatch']);
    });
});
describe('runMetric', () => {
    it('executes the exactMatch metric', async () => {
        const openai = {};
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
        });
        const scores = await runMetric('cosineSim', openai, [
            { prediction: 'a', reference: 'b' },
        ]);
        const expected = 1 / Math.sqrt(5);
        expect(scores[0]).toBeCloseTo(expected);
        expect(openai.embeddings.create).toHaveBeenCalledTimes(2);
    });
    it('throws for unknown metric', async () => {
        const openai = {};
        await expect(runMetric('missing', openai, [])).rejects.toThrow('Unknown metric');
    });
    it('respects concurrency limits', async () => {
        const openai = new MockOpenAI({
            x: [1, 0],
            y: [1, 0],
        });
        let inFlight = 0;
        let maxInFlight = 0;
        openai.embeddings.create.mockImplementation(async () => {
            inFlight += 1;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((resolve) => {
                setTimeout(resolve, 10);
            });
            inFlight -= 1;
            return {
                data: [{ embedding: [1, 0] }],
            };
        });
        const items = [
            { prediction: 'x', reference: 'y' },
            { prediction: 'x', reference: 'y' },
        ];
        const scores = await runMetric('cosineSim', openai, items, 1);
        expect(scores).toEqual([1, 1]);
        expect(maxInFlight).toBeLessThanOrEqual(2);
    });
});
