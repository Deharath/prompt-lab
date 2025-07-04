// Core API exports
export * from './providers/index.js';
export * from './jobs/service.js';
export * from './db/index.js';
export * from './db/schema.js';
export * from './evaluation/providers.js';
export * from './evaluation/metrics/index.js';
export * from './utils/logger.js';
export * from './config/index.js';
export * from './types/index.js';
export * from './constants/index.js';
export * from './errors/ApiError.js';

// Explicit metrics exports for better TypeScript resolution
// NOTE: Old metrics moved to new system in lib/metrics.js

// NEW metrics system exports
export {
  calculateMetrics,
  calculateSelectedMetricsLegacy,
  getAvailableMetrics,
  type MetricInput,
  type MetricResult,
} from './lib/metrics.js';
