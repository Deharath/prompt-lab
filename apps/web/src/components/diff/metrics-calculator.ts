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
  const baseMetrics = (baseJob.metrics as Record<string, number>) || {};
  const compareMetrics = (compareJob.metrics as Record<string, number>) || {};
  const metricKeys = getMetricKeys(baseMetrics, compareMetrics);

  return metricKeys.map((key) =>
    calculateStat(key, baseMetrics, compareMetrics),
  );
};
