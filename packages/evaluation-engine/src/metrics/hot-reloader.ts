import { promises as fs } from 'fs';
import { join } from 'path';
import type { MetricPlugin } from '@prompt-lab/shared-types';
import { MetricRegistry } from './registry.js';

/**
 * Hot reloading system for metric plugins during development
 */
export class MetricHotReloader {
  private static watchers = new Map<string, any>();
  private static isWatching = false;

  /**
   * Start watching a directory for changes
   */
  static async watchDirectory(dir: string): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      console.debug(
        '[MetricHotReloader] Hot reloading only available in development mode',
      );
      return;
    }

    if (this.watchers.has(dir)) {
      console.debug(`[MetricHotReloader] Already watching ${dir}`);
      return;
    }

    try {
      // Use fs.watch for better cross-platform support
      const { watch } = await import('fs');
      const watcher = watch(
        dir,
        { recursive: true },
        (eventType: string, filename: string | null) => {
          if (
            filename &&
            (filename.endsWith('.ts') || filename.endsWith('.js'))
          ) {
            this.handleFileChange(join(dir, filename), eventType);
          }
        },
      );

      this.watchers.set(dir, watcher);
      console.log(`[MetricHotReloader] Watching ${dir} for changes`);
    } catch (error) {
      console.warn(
        `[MetricHotReloader] Failed to watch directory ${dir}:`,
        error,
      );
    }
  }

  /**
   * Stop watching a directory
   */
  static async stopWatchingDirectory(dir: string): Promise<void> {
    const watcher = this.watchers.get(dir);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(dir);
      console.log(`[MetricHotReloader] Stopped watching ${dir}`);
    }
  }

  /**
   * Stop all watchers
   */
  static async stopAll(): Promise<void> {
    const promises = Array.from(this.watchers.entries()).map(
      ([dir, watcher]) => {
        return watcher.close().then(() => {
          console.log(`[MetricHotReloader] Stopped watching ${dir}`);
        });
      },
    );

    await Promise.all(promises);
    this.watchers.clear();
    this.isWatching = false;
  }

  /**
   * Handle file changes
   */
  private static async handleFileChange(
    filePath: string,
    eventType: string,
  ): Promise<void> {
    if (eventType !== 'change') {
      return;
    }

    // Debounce rapid changes
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      console.log(`[MetricHotReloader] Detected change in ${filePath}`);
      await this.reloadFile(filePath);
    } catch (error) {
      console.error(
        `[MetricHotReloader] Failed to handle change in ${filePath}:`,
        error,
      );
    }
  }

  /**
   * Reload a specific file
   */
  private static async reloadFile(filePath: string): Promise<void> {
    try {
      // Clear the module cache if in Node.js
      if (typeof require !== 'undefined' && require.cache) {
        delete require.cache[require.resolve(filePath)];
      }

      // Re-import the module
      const module = await import(`${filePath}?t=${Date.now()}`);

      // Find and re-register metric plugins
      let reloadedCount = 0;

      Object.entries(module).forEach(([exportName, exported]) => {
        if (this.isMetricPlugin(exported)) {
          const plugin = exported;

          // Re-register the plugin
          MetricRegistry.register(plugin);

          // Check if it should be a default metric
          if (
            module.isDefault === true ||
            module[`${exportName}IsDefault`] === true
          ) {
            MetricRegistry.setDefault(plugin.id);
          }

          reloadedCount++;
          console.log(`[MetricHotReloader] Reloaded metric: ${plugin.id}`);
        }
      });

      if (reloadedCount > 0) {
        console.log(
          `[MetricHotReloader] Successfully reloaded ${reloadedCount} metric(s) from ${filePath}`,
        );
      }
    } catch (error) {
      console.error(`[MetricHotReloader] Failed to reload ${filePath}:`, error);
    }
  }

  /**
   * Check if an object is a metric plugin
   */
  private static isMetricPlugin(obj: any): obj is MetricPlugin {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      typeof obj.category === 'string' &&
      typeof obj.version === 'string' &&
      typeof obj.calculate === 'function' &&
      obj.displayConfig &&
      typeof obj.displayConfig === 'object'
    );
  }

  /**
   * Initialize hot reloading for metric directories
   */
  static async initialize(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    if (this.isWatching) {
      return;
    }

    const metricsDir = join(
      process.cwd(),
      'packages/evaluation-engine/src/metrics',
    );

    try {
      await this.watchDirectory(join(metricsDir, 'builtin'));
      await this.watchDirectory(join(metricsDir, 'custom'));
      this.isWatching = true;

      console.log(
        '[MetricHotReloader] Hot reloading initialized for development',
      );
    } catch (error) {
      console.warn(
        '[MetricHotReloader] Failed to initialize hot reloading:',
        error,
      );
    }
  }

  /**
   * Get hot reloading status
   */
  static getStatus(): { isWatching: boolean; watchedDirs: string[] } {
    return {
      isWatching: this.isWatching,
      watchedDirs: Array.from(this.watchers.keys()),
    };
  }
}
