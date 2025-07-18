// Type definitions for better type safety

// Note: ApiResponse and PaginatedResponse moved to local definitions

export interface JobMetrics {
  // Content Quality Metrics
  flesch_reading_ease?: number;
  sentiment?: number;
  word_count?: number;

  // Structure & Format Metrics
  is_valid_json?: boolean | { isValid: boolean; errorMessage?: string };

  // Keyword Analysis
  keywords?: {
    found: string[];
    missing: string[];
    foundCount: number;
    missingCount: number;
    matchPercentage: number;
  };

  // Classification Metrics (when applicable)
  precision?: number;
  recall?: number;
  f_score?: number;

  // Performance (only essential)
  response_time_ms?: number;

  // Cost (only if needed for budgeting)
  estimated_cost_usd?: number;
}

export interface BatchEvaluationResult {
  prediction: string;
  reference: string;
  score: number;
  tokens: number;
  latencyMs: number;
  model: string;
  provider: string;
}

export interface EvaluationSummary {
  perItem: BatchEvaluationResult[];
  aggregates: JobMetrics;
}

export interface StreamMessage {
  type: 'progress' | 'result' | 'error' | 'complete';
  data: string | JobMetrics | { message: string } | unknown;
  timestamp: number;
}

export interface JobCreateRequest {
  prompt: string;
  provider: string;
  model: string;
}

export interface EvaluationRequest {
  promptTemplate: string;
  model: string;
  testSetId: string;
}

// Provider-specific configurations
export interface ProviderConfig {
  apiKey: string;
  timeout: number;
  maxRetries: number;
  models: string[];
}

export interface OpenAIConfig extends ProviderConfig {
  organization?: string;
  baseURL?: string;
}

export interface GeminiConfig extends ProviderConfig {
  projectId?: string;
  location?: string;
}

// Database types with proper constraints
// Re-export from shared-types
import type { JobStatus } from '@prompt-lab/shared-types';
export type { JobStatus } from '@prompt-lab/shared-types';

export interface JobWithTypedMetrics {
  id: string;
  prompt: string;
  provider: string;
  model: string;
  status: JobStatus;
  result: string | null;
  metrics: JobMetrics | null;
  errorMessage: string | null;
  tokensUsed: number | null;
  costUsd: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
// Moved to @prompt-lab/shared-types

// Moved to @prompt-lab/shared-types

// Configuration types
export interface RateLimitConfig {
  windowMs: number;
  globalMax: number;
  jobsMax: number;
}

export interface SecurityConfig {
  requestSizeLimit: string;
  enableTrustProxy: boolean;
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  enableFileLogging: boolean;
  maxFileSize: number;
  maxFiles: number;
}

// Validation schemas (to be used with Zod)
export interface ValidationSchemas {
  jobCreate: JobCreateRequest;
  evaluation: EvaluationRequest;
  jobUpdate: Partial<
    Pick<JobWithTypedMetrics, 'status' | 'result' | 'metrics' | 'errorMessage'>
  >;
}

// Utility types
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Event types for job streaming
export interface JobEvent {
  jobId: string;
  type: 'created' | 'started' | 'progress' | 'completed' | 'failed';
  data: JobWithTypedMetrics | JobMetrics | { message: string } | unknown;
  timestamp: Date;
}
