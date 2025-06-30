import express, { type Express } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { log, config } from '@prompt-lab/api';
import { ApiError } from '@prompt-lab/api';
import jobsRouter from './routes/jobs.js';
import healthRouter from './routes/health.js';

// Resolve repo root from this file location
const rootDir = fileURLToPath(new URL('../../..', import.meta.url));

export const app: Express = express();

// Performance middleware
app.use(compression()); // Enable gzip compression

// Security middleware
app.use(express.json({ limit: config.security.requestSizeLimit })); // Limit request size

// Enable trust proxy if configured
if (config.security.enableTrustProxy) {
  app.set('trust proxy', true);
}

// Rate limiting for jobs API
const jobsRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.jobsMax,
  message: { error: 'Too many job requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiting (more permissive)
const globalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.globalMax,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

app.use('/health', healthRouter);
app.get('/health', (_req, res) => {
  res.redirect('/health/');
});

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
    // Check if error has our expected API error properties
    const hasApiErrorProperties =
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      'message' in err &&
      typeof (err as ApiError).statusCode === 'number';

    // If it's one of our custom API errors or has the expected properties, use the status code
    if (err instanceof ApiError || hasApiErrorProperties) {
      const apiError = err as {
        statusCode: number;
        message: string;
        code?: string;
      };
      log.warn('API Error', {
        code: apiError.code,
        statusCode: apiError.statusCode,
        message: apiError.message,
      });
      return res.status(apiError.statusCode).json({
        error: apiError.message,
        code: apiError.code,
      });
    }

    // For any other error, log it for debugging but don't expose details
    log.error(
      'Unexpected server error',
      {},
      err instanceof Error ? err : new Error(String(err)),
    );

    // Return generic error response
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR',
    });
  },
);

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const server = app.listen(config.server.port, config.server.host, () => {
    log.info(`API server started`, {
      port: config.server.port,
      env: config.server.env,
      host: config.server.host,
    });
    log.info(
      `Health endpoints available at http://${config.server.host}:${config.server.port}/health/*`,
    );
  });

  server.on('error', (error) => {
    log.error('Server failed to start', { error: error.message });
  });
}

export default app;
