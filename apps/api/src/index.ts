import express from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
});

const { PORT } = envSchema.parse(process.env);

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${PORT}`);
  });
}

export default app;
