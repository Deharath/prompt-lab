import { metricConfig } from './metric-config.js';
import { formatSentiment, formatNumber, formatObject } from './formatters.js';

export const processMetrics = (metrics: Record<string, unknown>) => {
  const categories: Record<
    string,
    Array<[string, string, string?, string?, unknown?, string?]>
  > = {
    quality: [],
    readability: [],
    sentiment: [],
    content: [],
    technical: [],
  };

  Object.entries(metrics).forEach(([key, value]) => {
    if (
      key.includes('_error') ||
      key.includes('start') ||
      key.includes('end') ||
      key.includes('totalTokens') ||
      key.includes('avgCosSim') ||
      key.includes('meanLatencyMs') ||
      key.includes('evaluationCases') ||
      key.includes('avgScore') ||
      key === 'latency'
    ) {
      return;
    }

    const config = metricConfig[key] || {
      category: 'technical',
      displayName: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'Custom metric',
    };
    const { category, displayName, description } = config;

    let formattedValue: string | number = '';
    let unit = '';

    if (key === 'sentiment') {
      const result = formatSentiment(value);
      formattedValue = result.formattedValue;
      unit = result.unit;
    } else if (typeof value === 'number') {
      const result = formatNumber(key, value);
      formattedValue = result.formattedValue;
      unit = result.unit;
    } else if (typeof value === 'object' && value !== null) {
      const result = formatObject(key, value);
      formattedValue = result.formattedValue;
      unit = result.unit;
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'Yes' : 'No';
      unit = value ? '✅' : '❌';
    } else if (typeof value === 'string') {
      formattedValue = value;
      unit = '';
    }

    categories[category].push([
      displayName,
      formattedValue.toString(),
      unit,
      description,
      value,
      key,
    ]);
  });

  return categories;
};
