export default async function runDeepEval(
  metricName: string,
  options: Record<string, unknown>,
) {
  const { metric } = await import('deepeval');
  return metric(metricName, options);
}
