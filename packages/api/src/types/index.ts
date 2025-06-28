// Type definitions for better type safety

export interface JobMetrics {
  totalTokens: number;
  avgCosSim: number;
  meanLatencyMs: number;
  costUSD: number;
  evaluationCases: number;
  startTime: number;
  endTime: number;
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
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

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
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

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
