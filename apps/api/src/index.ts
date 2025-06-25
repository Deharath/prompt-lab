import express, { type Express } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import evalRouter from './routes/eval.js';

// Resolve repo root from this file location
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
// Explicitly load the root .env file
dotenv.config({ path: join(rootDir, '.env') });

export const app: Express = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/eval', evalRouter);

// Serve built web UI from /public when present
app.use(express.static(join(rootDir, 'public')));

// Fallback to index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(join(rootDir, 'public', 'index.html'));
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction, // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  },
);

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
});

const { PORT } = envSchema.parse(process.env);

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

export default app;
