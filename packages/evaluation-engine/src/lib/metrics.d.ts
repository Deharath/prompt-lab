/**
 * Task 11 - Backend Metric Calculation
 * New metric calculation functions to replace DIY metrics
 * Implements Tasks 2-5 functionality
 */
export interface MetricInput {
  id: string;
  input?: string;
  weight?: number;
}
export interface MetricResult {
  [key: string]: unknown;
}
/**
 * Main metrics calculation function that replaces the DIY implementation
 */
export declare function calculateMetrics(
  text: string,
  selectedMetrics: MetricInput[],
): Promise<MetricResult>;
/**
 * Legacy compatibility function that returns metrics in the old format
 */
export declare function calculateSelectedMetricsLegacy(
  output: string,
  selectedMetrics?: unknown,
): Promise<Record<string, unknown>>;
/**
 * Get available metric definitions
 */
export declare function getAvailableMetrics(): Array<{
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
}>;
