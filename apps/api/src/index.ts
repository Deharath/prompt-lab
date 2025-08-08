import express, { type Express } from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { log, config, getDb } from '@prompt-lab/evaluation-engine';
import { ApiError } from '@prompt-lab/evaluation-engine';
import jobsRouter from './routes/jobs.js';
import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import metricsRouter from './routes/metrics.js';
import {
  qualitySummaryRouter,
  initializeCache,
  initializeMetrics,
} from '@prompt-lab/evaluation-engine';
import sentimentRouter from './routes/sentiment.js';
import { httpMetricsMiddleware, metricsHandler } from './lib/prometheus.js';

// Resolve repo root from this file location
const rootDir = (() => {
  try {
    return fileURLToPath(new URL('../../../..', import.meta.url));
  } catch (error) {
    // Fallback for test environments
    return process.cwd();
  }
})();

export const app: Express = express();

// Enable trust proxy setting FIRST (before rate limiters)
if (config.security.enableTrustProxy) {
  app.set('trust proxy', true);
} else {
  app.set('trust proxy', false);
}

// Performance middleware
app.use(compression()); // Enable gzip compression

// Security headers via helmet if available (configurable CSP)
{
  const isProd = config.server.env === 'production';
  const csp = isProd
    ? {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'"], // allow API + SSE on same origin
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      }
    : false; // disable CSP in dev to avoid blocking Vite, etc.

  const require = createRequire(import.meta.url);
  try {
    const helmet = require('helmet');
    app.use(
      helmet({
        contentSecurityPolicy: csp as any,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        xPoweredBy: false as any,
      }),
    );
  } catch {
    // Helmet not installed; continue with minimal headers below
  }
}

// Keep minimal additional headers (helmet already covers many)
app.use((req, res, next) => {
  if (config.server.env === 'production') {
    // Ensure referrer policy is set as desired
    res.setHeader('Referrer-Policy', 'no-referrer');
  }
  next();
});

// Request ID + access logging
app.use((req, res, next) => {
  const requestId =
    (req.headers['x-request-id'] as string | undefined) || randomUUID();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;

  const start = Date.now();
  log.request(req.method, req.originalUrl || req.url, { requestId });
  res.on('finish', () => {
    const duration = Date.now() - start;
    log.response(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
      { requestId },
    );
  });
  next();
});

// HTTP metrics middleware (Prometheus)
app.use(httpMetricsMiddleware);

// CORS (config-based)
app.use((req, res, next) => {
  const isProd = config.server.env === 'production';
  const allowedCsv = config.cors?.allowedOrigins;
  const allowedOrigins = new Set(
    (allowedCsv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const origin = req.headers.origin;
  if (!isProd) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (
    origin &&
    (allowedOrigins.size === 0 || allowedOrigins.has(origin))
  ) {
    // If no list provided, default to allow same-origin deployments
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Request-ID',
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Security middleware
app.use(express.json({ limit: config.security.requestSizeLimit })); // Limit request size

// Rate limiting for jobs API - stricter for writes, more permissive for reads
const jobsWriteRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.jobsMax,
  message: { error: 'Too many job requests, please try again later.' },
  standardHeaders: true,
  skip: (req) => req.method === 'GET', // Skip rate limiting for GET requests (reading history)
});

// Remove global and read rate limits, only apply write rate limit to POST /jobs

app.use('/health', healthRouter);
app.get('/health', (_req, res) => {
  res.redirect('/health/');
});

// Apply jobsWriteRateLimit only to POST /jobs
app.post('/jobs', jobsWriteRateLimit);
app.use('/jobs', jobsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/sentiment', sentimentRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api', qualitySummaryRouter);

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// Serve built web UI from /public when present (production only)
app.use(express.static(join(rootDir, 'public')));

// Fallback to index.html for SPA routing (only if index.html exists)
app.get('*', (_req, res) => {
  const indexPath = join(rootDir, 'public', 'index.html');
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // In development mode, return a simple API-only response
    res.status(404).json({
      error: 'Not Found',
      message:
        'This is the API server. Frontend is served separately in development mode.',
      availableEndpoints: [
        '/health',
        '/jobs',
        '/api/dashboard',
        '/api/metrics',
        '/api/quality-summary',
      ],
    });
  }
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
  (async () => {
    try {
      // Initialize database first to ensure it's ready before handling requests
      log.info('Initializing database...');
      const dbStartTime = performance.now();
      await getDb(); // This will run migrations and set up the database
      const dbInitTime = performance.now() - dbStartTime;
      log.info(`Database initialized in ${dbInitTime.toFixed(2)}ms`);

      // Initialize quality summary cache
      initializeCache();

      // Initialize metrics system during server startup to avoid cold start delays
      log.info('Initializing metrics system...');
      const metricsStartTime = performance.now();
      await initializeMetrics();
      const metricsInitTime = performance.now() - metricsStartTime;
      log.info(`Metrics system initialized in ${metricsInitTime.toFixed(2)}ms`);

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
        log.error('Server failed to start', {
          error: error.message,
          stack: error.stack,
        });
        process.exit(1);
      });
    } catch (error) {
      log.error(
        'Failed to start server',
        {},
        error instanceof Error ? error : new Error(String(error)),
      );
      process.exit(1);
    }
  })();
}

export default app;
