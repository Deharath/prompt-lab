import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { Metric } from './types.js';

const defaultDir = join(new URL('.', import.meta.url).pathname, 'metrics');

export async function discoverMetrics(dir: string = defaultDir): Promise<Map<string, Metric>> {
  const entries = await readdir(dir);
  const metrics = new Map<string, Metric>();
  await Promise.all(entries.filter((f) => f.endsWith('.js')).map(async (file) => {
    const name = file.replace(extname(file), '');
    const mod = await import(join(dir, file));
    const metric: Metric = mod.default ?? mod.metric;
    if (metric && typeof metric.evaluate === 'function') {
      metrics.set(name, metric);
    }
  }));
  return metrics;
}

export async function runMetric(name: string, args: Parameters<Metric['evaluate']>[0], dir?: string) {
  const metrics = await discoverMetrics(dir);
  const metric = metrics.get(name);
  if (!metric) {
    throw new Error(`Metric not found: ${name}`);
  }
  return metric.evaluate(args);
}
