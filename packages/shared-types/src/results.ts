/**
 * Shared type definitions for evaluation results and metrics display
 */

import { MetricResult, MetricCategory } from './metrics';

// Proper metric display data structure instead of primitive tuple
export interface MetricDisplayItem {
  id: string;
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
  originalValue: unknown;
  originalKey: string;
  isDisabled?: boolean;
  category: MetricCategory;
  tooltip?: string;
  hasError?: boolean;
  errorMessage?: string;
  colSpan?: number;
}

// All categories are now in the base MetricCategory enum

// Configuration for metric display
export interface MetricDisplayConfig {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  unit?: string;
  formatter?: (value: unknown) => string;
  isEnabled?: boolean;
  tooltip?: string;
  precision?: number;
  thresholds?: {
    good?: number;
    warning?: number;
    error?: number;
  };
  colSpan?: number;
}

// Grouped metrics for display
export interface MetricGroup {
  category: MetricCategory;
  title: string;
  description?: string;
  items: MetricDisplayItem[];
  isCollapsed?: boolean;
  hasErrors?: boolean;
}

// Complete processed metrics result
export interface ProcessedMetricsResult {
  groups: MetricGroup[];
  totalMetrics: number;
  errorCount: number;
  processingTime?: number;
  hasData: boolean;
}

// Metric processing options
export interface MetricProcessingOptions {
  includeDisabled?: boolean;
  sortBy?: 'name' | 'category' | 'value';
  sortOrder?: 'asc' | 'desc';
  groupByCategory?: boolean;
  precision?: number;
  showTooltips?: boolean;
}

// Metric formatter function type
export type MetricFormatter = (
  value: unknown,
  originalKey?: string,
) => {
  displayValue: string;
  unit?: string;
  hasError?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
};

// View state for metrics display
export interface MetricsViewState {
  collapsedGroups: Set<MetricCategory>;
  sortBy: 'name' | 'category' | 'value';
  sortOrder: 'asc' | 'desc';
  showTooltips: boolean;
  compactMode: boolean;
}

// Error states for metrics display (extends base MetricError)
export interface MetricDisplayError {
  metricId: string;
  message: string;
  originalValue?: unknown;
  timestamp: number;
}

// Type guards for metrics data
export function isValidMetricDisplayItem(
  item: unknown,
): item is MetricDisplayItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    'value' in item &&
    'originalKey' in item &&
    'category' in item &&
    typeof (item as MetricDisplayItem).id === 'string' &&
    typeof (item as MetricDisplayItem).name === 'string' &&
    typeof (item as MetricDisplayItem).originalKey === 'string'
  );
}

export function isValidMetricGroup(group: unknown): group is MetricGroup {
  return (
    typeof group === 'object' &&
    group !== null &&
    'category' in group &&
    'title' in group &&
    'items' in group &&
    Object.values(MetricCategory).includes((group as MetricGroup).category) &&
    Array.isArray((group as MetricGroup).items) &&
    (group as MetricGroup).items.every(isValidMetricDisplayItem)
  );
}

// Utility functions
export function createEmptyMetricsResult(): ProcessedMetricsResult {
  return {
    groups: [],
    totalMetrics: 0,
    errorCount: 0,
    hasData: false,
  };
}

export function getMetricCategoryTitle(category: MetricCategory): string {
  const titles: Record<MetricCategory, string> = {
    [MetricCategory.READABILITY]: 'Readability',
    [MetricCategory.SENTIMENT]: 'Sentiment Analysis',
    [MetricCategory.CONTENT]: 'Content Analysis',
    [MetricCategory.STRUCTURE]: 'Structure & Format',
    [MetricCategory.QUALITY]: 'Quality Metrics',
    [MetricCategory.KEYWORDS]: 'Keywords & Terms',
    [MetricCategory.VALIDATION]: 'Validation',
    [MetricCategory.PERFORMANCE]: 'Performance',
    [MetricCategory.CUSTOM]: 'Custom Metrics',
  };
  return titles[category];
}

export function getMetricCategoryDescription(category: MetricCategory): string {
  const descriptions: Record<MetricCategory, string> = {
    [MetricCategory.READABILITY]: 'Text readability and complexity metrics',
    [MetricCategory.SENTIMENT]: 'Emotional tone and sentiment analysis',
    [MetricCategory.CONTENT]: 'Content quality and relevance metrics',
    [MetricCategory.STRUCTURE]: 'Document structure and formatting',
    [MetricCategory.QUALITY]: 'Overall quality assessment metrics',
    [MetricCategory.KEYWORDS]: 'Keyword presence and analysis',
    [MetricCategory.VALIDATION]: 'Data validation and format checking',
    [MetricCategory.PERFORMANCE]: 'Performance and latency metrics',
    [MetricCategory.CUSTOM]: 'User-defined custom metrics',
  };
  return descriptions[category];
}
