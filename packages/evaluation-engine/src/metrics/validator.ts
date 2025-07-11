import type {
  MetricPlugin,
  ValidationResult,
  MetricCategory,
} from '@prompt-lab/shared-types';

export class PluginValidator {
  /**
   * Validate a metric plugin
   */
  static validate(plugin: MetricPlugin): ValidationResult {
    const errors: string[] = [];

    // Validate required fields
    if (!plugin.id) {
      errors.push('Plugin must have an id');
    }

    if (!plugin.name) {
      errors.push('Plugin must have a name');
    }

    if (!plugin.description) {
      errors.push('Plugin must have a description');
    }

    if (!plugin.version) {
      errors.push('Plugin must have a version');
    }

    if (!plugin.calculate || typeof plugin.calculate !== 'function') {
      errors.push('Plugin must have a calculate function');
    }

    // Validate ID format
    if (plugin.id && !/^[a-z][a-z0-9_]*$/.test(plugin.id)) {
      errors.push(
        'Plugin ID must start with a letter and contain only lowercase letters, numbers, and underscores',
      );
    }

    // Validate category
    if (!plugin.category) {
      errors.push('Plugin must have a category');
    } else if (!this.isValidCategory(plugin.category)) {
      errors.push(`Plugin category "${plugin.category}" is not valid`);
    }

    // Validate display config
    if (!plugin.displayConfig) {
      errors.push('Plugin must have display config');
    } else {
      const displayErrors = this.validateDisplayConfig(plugin.displayConfig);
      errors.push(...displayErrors);
    }

    // Validate version format
    if (
      plugin.version &&
      !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(plugin.version)
    ) {
      errors.push(
        'Plugin version must follow semantic versioning (e.g., 1.0.0)',
      );
    }

    // Validate input configuration
    if (plugin.requiresInput) {
      if (!plugin.inputLabel) {
        errors.push('Plugin with requiresInput must have inputLabel');
      }

      if (!plugin.inputPlaceholder) {
        errors.push('Plugin with requiresInput should have inputPlaceholder');
      }
    }

    // Validate dependencies
    if (plugin.dependencies) {
      if (!Array.isArray(plugin.dependencies)) {
        errors.push('Plugin dependencies must be an array');
      } else {
        for (const dep of plugin.dependencies) {
          if (typeof dep !== 'string') {
            errors.push('All plugin dependencies must be strings');
            break;
          }
        }
      }
    }

    // Validate memory requirements
    if (
      plugin.requiresMemory &&
      (typeof plugin.requiresMemory !== 'number' || plugin.requiresMemory < 0)
    ) {
      errors.push('Plugin requiresMemory must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate display configuration
   */
  private static validateDisplayConfig(config: any): string[] {
    const errors: string[] = [];

    if (!config.id) {
      errors.push('Display config must have an id');
    }

    if (!config.name) {
      errors.push('Display config must have a name');
    }

    if (!config.description) {
      errors.push('Display config must have a description');
    }

    if (!config.category) {
      errors.push('Display config must have a category');
    }

    if (
      config.precision &&
      (typeof config.precision !== 'number' || config.precision < 0)
    ) {
      errors.push('Display config precision must be a non-negative number');
    }

    if (config.thresholds) {
      const { good, warning, error } = config.thresholds;

      if (good !== undefined && typeof good !== 'number') {
        errors.push('Threshold "good" must be a number');
      }

      if (warning !== undefined && typeof warning !== 'number') {
        errors.push('Threshold "warning" must be a number');
      }

      if (error !== undefined && typeof error !== 'number') {
        errors.push('Threshold "error" must be a number');
      }
    }

    return errors;
  }

  /**
   * Check if a category is valid
   */
  private static isValidCategory(category: string): boolean {
    const validCategories = [
      'readability',
      'sentiment',
      'content',
      'structure',
      'quality',
      'keywords',
      'validation',
      'performance',
      'custom',
    ];

    return validCategories.includes(category);
  }

  /**
   * Validate multiple plugins
   */
  static validateAll(plugins: MetricPlugin[]): {
    valid: MetricPlugin[];
    invalid: Array<{ plugin: MetricPlugin; errors: string[] }>;
  } {
    const valid: MetricPlugin[] = [];
    const invalid: Array<{ plugin: MetricPlugin; errors: string[] }> = [];

    for (const plugin of plugins) {
      const result = this.validate(plugin);

      if (result.isValid) {
        valid.push(plugin);
      } else {
        invalid.push({ plugin, errors: result.errors });
      }
    }

    return { valid, invalid };
  }
}
