import client from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

export const registry = new client.Registry();

// Collect default Node.js and process metrics with a prefix to avoid clashes
client.collectDefaultMetrics({ register: registry, prefix: 'promptlab_' });

// Total HTTP requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'status_code'] as const,
  registers: [registry],
});

// HTTP request duration histogram
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'status_code'] as const,
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

// Express middleware to track HTTP metrics
export function httpMetricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const diffNs = Number(process.hrtime.bigint() - start);
    const seconds = diffNs / 1e9;
    const labels = {
      method: req.method,
      status_code: String(res.statusCode),
    } as const;
    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, seconds);
  });
  next();
}

// Handler for GET /metrics
export async function metricsHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', registry.contentType);
  res.end(await registry.metrics());
}
export const metrics = {
  registry,
  httpRequestsTotal,
  httpRequestDurationSeconds,
};
