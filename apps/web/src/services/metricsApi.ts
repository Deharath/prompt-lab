import { MetricOption, MetricCategory } from '@prompt-lab/shared-types';

export interface ApiMetricOption extends MetricOption {
  version: string;
  isDefault: boolean;
  displayConfig: {
    unit?: string;
    formatter?: string;
    precision?: number;
    thresholds?: {
      good?: number;
      warning?: number;
      error?: number;
    };
    colSpan?: number;
  };
}

export interface MetricsApiResponse {
  success: boolean;
  data: {
    metrics: ApiMetricOption[];
    total: number;
    defaults: number;
    categories: string[];
  };
}

export interface CategoryApiResponse {
  success: boolean;
  data: {
    categories: Array<{
      category: string;
      count: number;
      plugins: Array<{
        id: string;
        name: string;
      }>;
    }>;
    total: number;
  };
}

class MetricsApiService {
  private baseUrl = '/api/metrics';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getAvailableMetrics(): Promise<ApiMetricOption[]> {
    const cacheKey = 'available_metrics';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/available`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch metrics: ${response.status} ${response.statusText}`,
        );
      }

      const result: MetricsApiResponse = await response.json();

      if (!result.success) {
        throw new Error('API returned error status');
      }

      this.setCache(cacheKey, result.data.metrics);
      return result.data.metrics;
    } catch (error) {
      console.error('[MetricsApi] Failed to fetch available metrics:', error);

      // Return fallback static metrics if API fails
      return this.getFallbackMetrics();
    }
  }

  async getMetricCategories(): Promise<string[]> {
    const cacheKey = 'metric_categories';

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch categories: ${response.status} ${response.statusText}`,
        );
      }

      const result: CategoryApiResponse = await response.json();

      if (!result.success) {
        throw new Error('API returned error status');
      }

      const categories = result.data.categories.map((c) => c.category);
      this.setCache(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('[MetricsApi] Failed to fetch metric categories:', error);

      // Return fallback categories
      return Object.values(MetricCategory);
    }
  }

  async getMetricById(id: string): Promise<ApiMetricOption | null> {
    const cacheKey = `metric_${id}`;

    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Failed to fetch metric: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error('API returned error status');
      }

      this.setCache(cacheKey, result.data);
      return result.data;
    } catch (error) {
      console.error(`[MetricsApi] Failed to fetch metric '${id}':`, error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFallbackMetrics(): ApiMetricOption[] {
    // Fallback to static metrics if API is unavailable
    return [
      {
        id: 'word_count',
        name: 'Word Count',
        description: 'Total number of words in the text',
        category: MetricCategory.CONTENT,
        version: '1.0.0',
        isDefault: true,
        displayConfig: { unit: 'words', colSpan: 1 },
      },
      {
        id: 'sentence_count',
        name: 'Sentence Count',
        description: 'Total number of sentences in the text',
        category: MetricCategory.CONTENT,
        version: '1.0.0',
        isDefault: true,
        displayConfig: { unit: 'sentences', colSpan: 1 },
      },
      {
        id: 'flesch_reading_ease',
        name: 'Flesch Reading Ease',
        description: 'Text readability score (0-100, higher = easier)',
        category: MetricCategory.READABILITY,
        version: '1.0.0',
        isDefault: true,
        displayConfig: {
          unit: 'score',
          colSpan: 1,
          thresholds: { good: 70, warning: 30, error: 0 },
        },
      },
      {
        id: 'flesch_kincaid_grade',
        name: 'Flesch-Kincaid Grade Level',
        description: 'Grade level required to understand the text',
        category: MetricCategory.READABILITY,
        version: '1.0.0',
        isDefault: true,
        displayConfig: { unit: 'grade', colSpan: 1 },
      },
      {
        id: 'sentiment',
        name: 'Sentiment Analysis',
        description:
          'Overall sentiment of the text (positive, negative, neutral)',
        category: MetricCategory.SENTIMENT,
        version: '1.0.0',
        isDefault: true,
        displayConfig: { colSpan: 1 },
      },
    ];
  }
}

export const metricsApiService = new MetricsApiService();
export default metricsApiService;
