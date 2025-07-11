import type { MetricPlugin } from '@prompt-lab/shared-types';

export class MetricRegistry {
  private static plugins = new Map<string, MetricPlugin>();
  private static defaultIds = new Set<string>();

  static register(plugin: MetricPlugin): void {
    if (!plugin.id) {
      throw new Error('Plugin must have an id');
    }

    this.plugins.set(plugin.id, plugin);
  }

  static unregister(id: string): void {
    this.plugins.delete(id);
    this.defaultIds.delete(id);
  }

  static get(id: string): MetricPlugin | undefined {
    return this.plugins.get(id);
  }

  static getAll(): MetricPlugin[] {
    return Array.from(this.plugins.values());
  }

  static getByCategory(category: string): MetricPlugin[] {
    return this.getAll().filter((plugin) => plugin.category === category);
  }

  static getDefaults(): MetricPlugin[] {
    return this.getAll().filter((plugin) => this.defaultIds.has(plugin.id));
  }

  static setDefault(id: string): void {
    if (this.plugins.has(id)) {
      this.defaultIds.add(id);
    }
  }

  static removeDefault(id: string): void {
    this.defaultIds.delete(id);
  }

  static clear(): void {
    this.plugins.clear();
    this.defaultIds.clear();
  }

  static size(): number {
    return this.plugins.size;
  }

  static has(id: string): boolean {
    return this.plugins.has(id);
  }

  static getIds(): string[] {
    return Array.from(this.plugins.keys());
  }
}
