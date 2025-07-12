import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { MetricPlugin } from '@prompt-lab/shared-types';
import { MetricRegistry } from './registry.js';
import { log } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class MetricAutoLoader {
  private static readonly PLUGIN_EXTENSIONS = ['.js', '.ts'];

  /**
   * Load metrics from a specific directory
   */
  static async loadFromDirectory(dir: string): Promise<void> {
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = join(dir, file.name);

        if (file.isDirectory()) {
          // Recursively load from subdirectories
          await this.loadFromDirectory(filePath);
        } else if (file.isFile() && this.isValidPluginFile(file.name)) {
          await this.loadFile(filePath);
        }
      }
    } catch (error) {
      log.warn('Failed to load directory', {
        path: dir,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load all builtin metrics
   */
  static async loadBuiltinMetrics(): Promise<void> {
    const builtinDir = join(__dirname, 'builtin');
    await this.loadFromDirectory(builtinDir);
  }

  /**
   * Load custom metrics from user directory
   */
  static async loadCustomMetrics(): Promise<void> {
    const customDir = join(__dirname, 'custom');
    try {
      await this.loadFromDirectory(customDir);
    } catch (error) {
      // Custom directory is optional
      log.debug('Custom metrics directory not found or empty', {
        path: customDir,
      });
    }
  }

  /**
   * Load all metrics (builtin + custom)
   */
  static async loadAllMetrics(): Promise<void> {
    await Promise.all([this.loadBuiltinMetrics(), this.loadCustomMetrics()]);
  }

  /**
   * Load a specific plugin file
   */
  private static async loadFile(filePath: string): Promise<void> {
    try {
      // Convert Windows paths to file:// URLs for ESM imports
      const importPath =
        process.platform === 'win32'
          ? `file:///${filePath.replace(/\\/g, '/')}`
          : filePath;

      const module = await import(importPath);

      // Check all exports for metric plugins
      for (const [exportName, exported] of Object.entries(module)) {
        if (this.isMetricPlugin(exported)) {
          const plugin = exported;

          // Register the plugin
          MetricRegistry.register(plugin);

          // Check if it should be a default metric
          if (
            module.isDefault === true ||
            module[`${exportName}IsDefault`] === true
          ) {
            MetricRegistry.setDefault(plugin.id);
          }

          log.debug('Loaded metric', { id: plugin.id, path: filePath });
        }
      }
    } catch (error) {
      log.error(
        'Failed to load file',
        { path: filePath },
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Check if a file is a valid plugin file
   */
  private static isValidPluginFile(fileName: string): boolean {
    return (
      this.PLUGIN_EXTENSIONS.some((ext) => fileName.endsWith(ext)) &&
      !fileName.includes('.test.') &&
      !fileName.includes('.spec.') &&
      fileName !== 'index.js' &&
      fileName !== 'index.ts'
    );
  }

  /**
   * Type guard to check if an object is a MetricPlugin
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
   * Get loading statistics
   */
  static getStats(): {
    total: number;
    defaults: number;
    categories: Record<string, number>;
  } {
    const plugins = MetricRegistry.getAll();
    const defaults = MetricRegistry.getDefaults();

    const categories = plugins.reduce(
      (acc, plugin) => {
        acc[plugin.category] = (acc[plugin.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: plugins.length,
      defaults: defaults.length,
      categories,
    };
  }
}
