export { MetricRegistry } from './registry.js';
export { MetricAutoLoader } from './loader.js';
export { PluginValidator } from './validator.js';
export { ConditionalMetrics } from './conditional.js';
export { MetricHotReloader } from './hot-reloader.js';
import { MetricRegistry } from './registry.js';
import { MetricAutoLoader } from './loader.js';
import { MetricHotReloader } from './hot-reloader.js';

// Initialize and load all metrics
export async function initializeMetrics(): Promise<void> {
  try {
    await MetricAutoLoader.loadAllMetrics();
    const stats = MetricAutoLoader.getStats();

    console.info(
      `[Metrics] Loaded ${stats.total} metrics (${stats.defaults} defaults)`,
    );
    console.debug(`[Metrics] Categories:`, stats.categories);

    // Initialize hot reloading in development
    if (process.env.NODE_ENV === 'development') {
      await MetricHotReloader.initialize();
    }
  } catch (error) {
    console.error('[Metrics] Failed to initialize metrics:', error);
  }
}

// Export registry as default for convenience
export default MetricRegistry;
