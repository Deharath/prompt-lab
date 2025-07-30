import type { Request, Response } from 'express';
import { Router } from 'express';
import { MetricRegistry } from '@prompt-lab/evaluation-engine';
import { ApiError } from '../errors/ApiError.js';

const router = Router();

/**
 * GET /api/metrics/available
 * Returns all available metrics from the plugin registry
 */
router.get('/available', async (_req: Request, res: Response) => {
  try {
    const plugins = MetricRegistry.getAll();
    const defaults = MetricRegistry.getDefaults();
    const defaultIds = new Set(defaults.map((p) => p.id));

    const availableMetrics = plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      version: plugin.version,
      isDefault: defaultIds.has(plugin.id),
      displayConfig: plugin.displayConfig,
      requiresInput: plugin.requiresInput || false,
      inputLabel: plugin.inputLabel,
      inputPlaceholder: plugin.inputPlaceholder,
    }));

    res.json({
      success: true,
      data: {
        metrics: availableMetrics,
        total: plugins.length,
        defaults: defaults.length,
        categories: [...new Set(plugins.map((p) => p.category))].sort(),
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch available metrics:', error);
    throw new ApiError(
      'Failed to fetch available metrics',
      500,
      'METRICS_FETCH_ERROR',
    );
  }
});

/**
 * GET /api/metrics/categories
 * Returns all available metric categories
 */
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const plugins = MetricRegistry.getAll();
    const categories = [...new Set(plugins.map((p) => p.category))].sort();

    const categoryStats = categories.map((category) => {
      const categoryPlugins = plugins.filter((p) => p.category === category);
      return {
        category,
        count: categoryPlugins.length,
        plugins: categoryPlugins.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        categories: categoryStats,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch metric categories:', error);
    throw new ApiError(
      'Failed to fetch metric categories',
      500,
      'CATEGORIES_FETCH_ERROR',
    );
  }
});

/**
 * GET /api/metrics/:id
 * Returns details for a specific metric plugin
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plugin = MetricRegistry.get(id);

    if (!plugin) {
      throw new ApiError(
        `Metric with id '${id}' not found`,
        404,
        'METRIC_NOT_FOUND',
      );
    }

    const defaults = MetricRegistry.getDefaults();
    const isDefault = defaults.some((p) => p.id === id);

    res.json({
      success: true,
      data: {
        ...plugin,
        isDefault,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error(`[API] Failed to fetch metric '${req.params.id}':`, error);
    throw new ApiError(
      'Failed to fetch metric details',
      500,
      'METRIC_FETCH_ERROR',
    );
  }
});

export default router;
