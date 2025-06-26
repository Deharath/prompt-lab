import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';

const app = express();
app.get('/boom', () => {
  throw new Error('boom');
});
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  },
);

describe('error handler', () => {
  it('returns 500 JSON', async () => {
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(JSON.parse(res.text)).toEqual({ error: 'Internal Server Error' });
  });
});
