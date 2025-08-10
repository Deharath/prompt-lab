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

// Job state gauge (current counts by state)
const jobStateGauge = new client.Gauge({
  name: 'jobs_state',
  help: 'Number of jobs in each state',
  labelNames: ['state'] as const,
  registers: [registry],
});

// Job transitions counter (how many jobs entered a given state)
const jobTransitionsTotal = new client.Counter({
  name: 'jobs_transitions_total',
  help: 'Total number of job state transitions',
  labelNames: ['from', 'to'] as const,
  registers: [registry],
});

export type JobState =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

function incState(state: JobState) {
  jobStateGauge.inc({ state });
  jobTransitionsTotal.inc({ from: 'none', to: state });
}

function decState(state: JobState) {
  jobStateGauge.dec({ state });
}

export function transitionJobState(from: JobState | null, to: JobState | null) {
  if (from) {
    decState(from);
  }
  if (to) {
    jobStateGauge.inc({ state: to });
  }
  jobTransitionsTotal.inc({ from: from ?? 'none', to: to ?? 'none' });
}

export function incrementJobState(state: JobState) {
  incState(state);
}

export function decrementJobState(state: JobState) {
  decState(state);
}

export function setJobStateGauge(state: JobState, value: number) {
  jobStateGauge.set({ state }, value);
}

export function seedJobStateGauges(values: Partial<Record<JobState, number>>) {
  const states: JobState[] = [
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
  ];
  for (const s of states) {
    jobStateGauge.set({ state: s }, values[s] ?? 0);
  }
}

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
// Worker metrics (added in roadmap item #6)
export const workerRunningGauge = new client.Gauge({
  name: 'worker_running',
  help: '1 if the in-process worker loop is active',
  registers: [registry],
});

export const workerClaimAttemptsTotal = new client.Counter({
  name: 'worker_claim_attempts_total',
  help: 'Total attempts to claim a job (including when none available)',
  registers: [registry],
});

export const workerClaimsSucceededTotal = new client.Counter({
  name: 'worker_claims_succeeded_total',
  help: 'Total successful job claims',
  registers: [registry],
});

export const workerCancellationsHonoredTotal = new client.Counter({
  name: 'worker_cancellations_honored_total',
  help: 'Jobs cancelled during execution due to cancelRequested flag',
  registers: [registry],
});

export const workerRetriesTotal = new client.Counter({
  name: 'worker_retries_total',
  help: 'Automatic retry attempts performed by worker',
  registers: [registry],
});

export const workerBackoffSecondsHistogram = new client.Histogram({
  name: 'worker_backoff_seconds',
  help: 'Observed backoff delay seconds between polling loops',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

export const metrics = {
  registry,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  jobStateGauge,
  jobTransitionsTotal,
  workerRunningGauge,
  workerClaimAttemptsTotal,
  workerClaimsSucceededTotal,
  workerCancellationsHonoredTotal,
  workerRetriesTotal,
  workerBackoffSecondsHistogram,
};
