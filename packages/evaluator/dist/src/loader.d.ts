import type { Metric, MetricArgs, MetricResult } from './types.js';
export declare function discoverMetrics(dir?: string): Map<string, Metric>;
export declare function runMetric(name: string, args: MetricArgs, dir?: string): Promise<MetricResult>;
