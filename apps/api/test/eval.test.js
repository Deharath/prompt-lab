/* eslint-disable max-classes-per-file, @typescript-eslint/lines-between-class-members */
import request from 'supertest';
// eslint-disable-next-line object-curly-newline
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import getPort from 'get-port';
vi.mock('openai', () => ({
    default: class {
        constructor() {
            this.chat = {
                completions: {
                    create: vi.fn(async () => ({
                        choices: [{ message: { content: 'mock completion' } }],
                        usage: { total_tokens: 5 },
                    })),
                },
            };
            this.embeddings = {
                create: vi.fn(async () => ({ data: [{ embedding: [1, 0] }] })),
            };
        }
    },
}));
if (!process.env.GEMINI_API_KEY) {
    vi.mock('@google/generative-ai', () => ({
        GoogleGenerativeAI: class {
            // eslint-disable-next-line class-methods-use-this
            getGenerativeModel() {
                return {
                    generateContent: vi.fn(async () => ({
                        response: { text: () => 'gem' },
                    })),
                };
            }
        },
    }));
}
// eslint-disable-next-line import/first
import { app } from '../dist/src/index.js';
let server;
let port;
beforeAll(async () => {
    port = await getPort();
    server = app.listen(port);
});
afterAll(() => {
    server.close();
});
describe('POST /eval', () => {
    it('503 when key missing', async () => {
        delete process.env.OPENAI_API_KEY;
        const res = await request(`http://localhost:${port}`).post('/eval').send({
            promptTemplate: '{{input}}',
            model: 'gpt-4.1-mini',
            testSetId: 'news-summaries',
        });
        expect(res.status).toBe(503);
    });
    it('returns evaluation results with key', async () => {
        process.env.OPENAI_API_KEY = 'test';
        const res = await request(`http://localhost:${port}`).post('/eval').send({
            promptTemplate: '{{input}}',
            model: 'gpt-4.1-mini',
            testSetId: 'news-summaries',
        });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.perItem)).toBe(true);
        expect(res.body.perItem.length).toBe(15);
    });
});
