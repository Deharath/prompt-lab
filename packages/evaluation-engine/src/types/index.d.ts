export interface JobMetrics {
  flesch_reading_ease?: number;
  sentiment?: number;
  word_count?: number;
  is_valid_json?:
    | boolean
    | {
        isValid: boolean;
        errorMessage?: string;
      };
  keywords?: {
    found: string[];
    missing: string[];
    foundCount: number;
    missingCount: number;
    matchPercentage: number;
  };
  precision?: number;
  recall?: number;
  f_score?: number;
  response_time_ms?: number;
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
  data:
    | string
    | JobMetrics
    | {
        message: string;
      }
    | unknown;
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
export interface ValidationSchemas {
  jobCreate: JobCreateRequest;
  evaluation: EvaluationRequest;
  jobUpdate: Partial<
    Pick<JobWithTypedMetrics, 'status' | 'result' | 'metrics' | 'errorMessage'>
  >;
}
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
export interface JobEvent {
  jobId: string;
  type: 'created' | 'started' | 'progress' | 'completed' | 'failed';
  data:
    | JobWithTypedMetrics
    | JobMetrics
    | {
        message: string;
      }
    | unknown;
  timestamp: Date;
}
