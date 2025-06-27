import express, { type Express } from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import evalRouter from './routes/eval.js';
import jobsRouter from './routes/jobs.js';
import { ApiError } from './errors/ApiError.js';

// Resolve repo root from this file location
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));
// Explicitly load the root .env file
dotenv.config({ path: join(rootDir, '.env') });

export const app: Express = express();

// Security middleware
app.use(express.json({ limit: '1mb' })); // Limit request size

// Rate limiting for jobs API
const jobsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for jobs
  message: { error: 'Too many job requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiting (more permissive)
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/eval', evalRouter);
app.use('/jobs', jobsRateLimit, jobsRouter);

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
    _next: express.NextFunction,
  ) => {
    // If it's one of our custom API errors, use the status code and message
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
      });
    }

    // For any other error, log it for debugging but don't expose details
    console.error('Unexpected error:', err);

    // Return generic error response
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  },
);

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
});

const { PORT } = envSchema.parse(process.env);

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

export default app;
