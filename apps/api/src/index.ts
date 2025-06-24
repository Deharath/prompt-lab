import { fileURLToPath } from 'url';
import express from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import evalRouter from './routes/eval.js';

dotenv.config();

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/eval', evalRouter);

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
});

const { PORT } = envSchema.parse(process.env);

const isEntry = process.argv[1] === fileURLToPath(import.meta.url);

if (isEntry) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

export default app;
