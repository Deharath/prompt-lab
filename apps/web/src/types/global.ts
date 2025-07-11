/**
 * Global Type Definitions for PromptLab Frontend
 *
 * This file contains shared TypeScript interfaces and types used across
 * the entire application for consistent typing and better developer experience.
 */

import type { JobStatus, MetricCategory } from '@prompt-lab/shared-types';

// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt?: Date;
  provider: ModelProvider;
  model: string;
  template: string;
  inputData: string;
  result?: string;
  metrics?: Record<string, number>;
  costUsd?: number | null;
  tokensUsed?: number;
  avgScore?: number | null;
  resultSnippet?: string | null;
  errorMessage?: string | null;
}

// Re-export from shared-types
export type { JobStatus } from '@prompt-lab/shared-types';
export type ModelProvider = 'openai' | 'gemini' | 'anthropic';

// =============================================================================
// UI COMPONENT TYPES
// =============================================================================

export interface BaseComponentProps {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export interface LoadingProps {
  loading: boolean;
  error?: string | null;
  isEmpty?: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// =============================================================================
// FORM & INPUT TYPES
// =============================================================================

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

export interface ValidatorResult {
  isValid: boolean;
  error?: string;
}

export type Validator<T> = (value: T) => ValidatorResult;

// =============================================================================
// METRICS & EVALUATION TYPES
// =============================================================================

export interface EvaluationMetric {
  id: string;
  name: string;
  description: string;
  category: MetricCategory;
  enabled: boolean;
  weight?: number;
  config?: Record<string, unknown>;
}

// Re-export from shared-types
export type { MetricCategory } from '@prompt-lab/shared-types';

export interface MetricResult {
  metricId: string;
  score: number;
  details?: Record<string, unknown>;
  explanation?: string;
}

// =============================================================================
// API & STATE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch?: Date;
}

// =============================================================================
// THEME & STYLING TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

// =============================================================================
// NAVIGATION & ROUTING TYPES
// =============================================================================

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  disabled?: boolean;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

// =============================================================================
// COMPARISON & DIFF TYPES
// =============================================================================

export interface ComparisonState {
  baseJobId?: string;
  compareJobId?: string;
  isActive: boolean;
}

export interface DiffResult {
  additions: number;
  deletions: number;
  changes: number;
  similarity: number;
}

// =============================================================================
// DASHBOARD & ANALYTICS TYPES
// =============================================================================

export interface DashboardStats {
  totalJobs: number;
  successRate: number;
  averageCost: number;
  averageScore: number;
  totalCost: number;
  jobsToday: number;
  scoreHistory: Array<{
    date: string;
    avgReadability: number;
    totalJobs: number;
  }>;
  costByModel: Array<{
    model: string;
    totalCost: number;
  }>;
  tokensByModel: Array<{
    model: string;
    totalTokens: number;
  }>;
  estimatedCostByModel: Array<{
    model: string;
    estimatedCost: number;
  }>;
}

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface CustomEvents {
  'job:created': { job: Job };
  'job:updated': { job: Job };
  'job:completed': { job: Job; metrics: Record<string, number> };
  'job:failed': { job: Job; error: string };
  'comparison:started': { baseJobId: string; compareJobId: string };
  'comparison:cleared': Record<string, never>;
}

export type EventCallback<T = unknown> = (data: T) => void;

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

// Type guard utilities
export const isJobCompleted = (job: Job): job is Job & { result: string } =>
  job.status === 'completed' && Boolean(job.result);

export const isJobFailed = (job: Job): job is Job & { errorMessage: string } =>
  job.status === 'failed' && Boolean(job.errorMessage);

// Type assertion utilities
export const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${value}`);
};
