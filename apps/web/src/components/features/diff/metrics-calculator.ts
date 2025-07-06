const isImprovement = (key: string, delta: number): boolean => {
  const lower = key.toLowerCase();
  if (
    lower.includes('cost') ||
    lower.includes('token') ||
    lower.includes('latency')
  ) {
    return delta <= 0;
  }
  return delta >= 0;
};

const getMetricKeys = (
  baseMetrics: Record<string, number>,
  compareMetrics: Record<string, number>,
): string[] => {
  return Array.from(
    new Set([...Object.keys(baseMetrics), ...Object.keys(compareMetrics)]),
  );
};

const calculateStat = (
  key: string,
  baseMetrics: Record<string, number>,
  compareMetrics: Record<string, number>,
) => {
  const baseVal = baseMetrics[key] ?? 0;
  const compareVal = compareMetrics[key] ?? 0;
  const delta = compareVal - baseVal;
  const deltaPercent = baseVal !== 0 ? (delta / baseVal) * 100 : 0;

  return {
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: compareVal,
    delta: deltaPercent,
    isImprovement: isImprovement(key, delta),
    baseValue: baseVal,
    compareValue: compareVal,
    rawDelta: delta,
  };
};

export const calculateMetricStats = (baseJob: any, compareJob: any) => {
  // Guard against missing job data
  if (!baseJob || !compareJob) {
    return [];
  }

  // Extract metrics with proper fallbacks
  const baseMetrics = (baseJob.metrics as Record<string, number>) || {};
  const compareMetrics = (compareJob.metrics as Record<string, number>) || {};

  // Filter out non-numeric values and null/undefined values
  const cleanBaseMetrics: Record<string, number> = {};
  const cleanCompareMetrics: Record<string, number> = {};

  Object.entries(baseMetrics).forEach(([key, value]) => {
    if (typeof value === 'number' && !isNaN(value)) {
      cleanBaseMetrics[key] = value;
    }
  });

  Object.entries(compareMetrics).forEach(([key, value]) => {
    if (typeof value === 'number' && !isNaN(value)) {
      cleanCompareMetrics[key] = value;
    }
  });

  const metricKeys = getMetricKeys(cleanBaseMetrics, cleanCompareMetrics);

  if (metricKeys.length === 0) {
    return [];
  }

  return metricKeys.map((key) =>
    calculateStat(key, cleanBaseMetrics, cleanCompareMetrics),
  );
};
