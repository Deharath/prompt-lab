import express from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
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

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

export default app;
