import type { MetricPlugin, MetricCategory } from '@prompt-lab/shared-types';

export const responseLatencyPlugin: MetricPlugin = {
  id: 'response_latency',
  name: 'Response Latency',
  description: 'Time taken to generate the response',
  category: 'performance' as MetricCategory,
  version: '1.0.0',

  displayConfig: {
    id: 'response_latency',
    name: 'Response Latency',
    description: 'Time taken to generate the response',
    category: 'performance' as MetricCategory,
    unit: 'ms',
    precision: 0,
    tooltip: 'Time taken to generate the response in milliseconds',
  },

  async calculate(
    text: string,
    input?: string,
    context?: any,
  ): Promise<number | undefined> {
    // This metric is typically injected by the job processing system
    // It's not calculated from the text itself but from timing data
    return context?.responseLatency || undefined;
  },
};

export const isDefault = false;
