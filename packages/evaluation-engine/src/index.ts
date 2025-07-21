// Core API exports
export * from './providers/index.js';
export * from './jobs/service.js';
export * from './db/index.js';
export * from './db/schema.js';
export * from './utils/logger.js';
export * from './config/index.js';
export * from './types/index.js';
export * from './constants/index.js';
export * from './errors/ApiError.js';

// Sentiment service exports
export {
  analyzeSentiment,
  type SentimentScore,
} from './lib/sentimentService.js';

// Pricing exports
export { PRICING, type ProviderPricing } from './providers/pricing.js';

// Explicit metrics exports for better TypeScript resolution
// NOTE: Metrics system consolidated in lib/metrics.js

// NEW metrics system exports
export {
  calculateMetrics,
  getAvailableMetrics,
  type MetricInput,
  type MetricResult,
} from './lib/metrics.js';

// Quality summary exports
export {
  default as qualitySummaryRouter,
  initializeCache,
  getQualitySummary,
  createQualitySummaryRouter,
  type QualitySummaryQuery,
  type QualitySummaryResponse,
} from './routes/quality-summary.js';

// Plugin-based metrics system exports
export {
  MetricRegistry,
  MetricAutoLoader,
  PluginValidator,
  ConditionalMetrics,
  MetricHotReloader,
  initializeMetrics,
  default as MetricRegistryDefault,
} from './metrics/index.js';

// Initialize metrics on module load (with better error handling)
import { initializeMetrics } from './metrics/index.js';
if (process.env.NODE_ENV !== 'production') {
  // In development, initialize metrics eagerly but handle failures gracefully
  initializeMetrics().catch((error) => {
    console.warn('Failed to initialize metrics on module load:', error);
  });
}
// In production, metrics are initialized explicitly during server startup
