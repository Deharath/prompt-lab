import type { DashboardStats } from './types/dashboard.js';
import type { QualitySummaryData } from './hooks/useQualitySummary.js';

// Helper function to parse dates from JSON

function parseDatesInObject<T>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => parseDatesInObject(item)) as T;
  }

  const result = { ...obj };
  for (const key in result) {
    if (key === 'createdAt' || key === 'updatedAt') {
      if (typeof result[key] === 'string') {
        result[key] = new Date(result[key]);
      }
    } else if (typeof result[key] === 'object') {
      result[key] = parseDatesInObject(result[key]);
    }
  }

  return result as T;
}

export interface JobRequest {
  prompt: string;
  template?: string;
  inputData?: string;
  provider: string;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  metrics?: Array<{ id: string; input?: string }>;
}

export interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'evaluating' | 'completed' | 'failed';
  createdAt: Date;
  provider: string;
  model: string;
  costUsd?: number | null;
  avgScore?: number | null;
  resultSnippet?: string | null;
}

export interface JobResult {
  id: string;
  status: 'pending' | 'running' | 'evaluating' | 'completed' | 'failed';
  result?: string;
  metrics?: Record<string, unknown>;
  tokensUsed?: number;
  costUsd?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface JobDetails extends JobResult {
  prompt: string;
  template?: string;
  inputData?: string;
  provider: string;
  model: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorCode: string | undefined;

        // Clone the response first, before any attempts to read the body
        const responseForJson = response.clone();
        const responseForText = response.clone();

        try {
          const errorData: ApiError = await responseForJson.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code;
        } catch {
          // If we can't parse JSON, try to get plain text
          try {
            errorMessage =
              (await responseForText.text()) || `HTTP ${response.status}`;
          } catch {
            errorMessage = `HTTP ${response.status}`;
          }
        }

        const error = new Error(errorMessage) as Error & {
          code?: string;
          status?: number;
        };
        error.code = errorCode;
        error.status = response.status;
        throw error;
      }

      const jsonData = await response.json();
      return parseDatesInObject<T>(jsonData);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async createJob(body: JobRequest): Promise<JobSummary> {
    const result = await this.makeRequest<JobSummary>('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return result;
  }

  static async fetchJob(id: string): Promise<JobDetails> {
    const result = await this.makeRequest<JobDetails>(`/jobs/${id}`);

    return result;
  }

  static streamJob(
    id: string,
    onMessage: (token: string) => void,
    onDone: () => void,
    onError?: (error: Error) => void,
    onMetrics?: (metrics: Record<string, unknown>) => void,
  ): EventSource {
    const es = new EventSource(`/jobs/${id}/stream`);
    let done = false;

    es.onopen = () => {
      // intentionally empty: event stream open handler
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.token) {
          onMessage(data.token);
        }
        if (data.error && onError) {
          onError(new Error(data.error));
        }
      } catch (_err) {
        // intentionally empty: ignore parse errors in event stream
      }
    };

    // Handle specific event types
    es.addEventListener('metrics', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (onMetrics) {
          onMetrics(data);
        }
      } catch (_err) {
        // intentionally empty: ignore parse errors in event stream
      }
    });

    es.addEventListener('done', (e: MessageEvent) => {
      try {
        JSON.parse(e.data);
        done = true;
        onDone();
        es.close();
      } catch (_err) {
        // intentionally empty: ignore parse errors in event stream
      }
    });

    es.addEventListener('error', (_e: MessageEvent) => {
      try {
        // Only call onError if the stream didn't complete normally
        if (onError) {
          onError(new Error('Stream error'));
        }
      } catch (_err) {
        // intentionally empty: ignore parse errors in event stream
      }
    });

    es.onerror = (_e) => {
      // Only call onError if the stream didn't complete normally
      if (!done && onError) {
        const error = new Error('Stream connection failed');
        onError(error);
      }
    };

    return es;
  }

  static async listJobs(): Promise<JobSummary[]> {
    const result = await this.makeRequest<JobSummary[]>('/jobs');
    return result;
  }

  static async diffJobs(
    baseId: string,
    compareId: string,
  ): Promise<{ baseJob: JobDetails; compareJob: JobDetails }> {
    const endpoint = `/jobs/${baseId}/diff?otherId=${compareId}`;
    const result = await this.makeRequest<{
      baseJob: JobDetails;
      compareJob: JobDetails;
    }>(endpoint);
    return result;
  }

  static async fetchDashboardStats(days: number = 30): Promise<DashboardStats> {
    const endpoint = `/api/dashboard/stats?days=${days}`;
    const result = await this.makeRequest<DashboardStats>(endpoint);
    return result;
  }

  static async deleteJob(id: string): Promise<void> {
    await this.makeRequest(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }

  static async fetchQualitySummary(
    params: {
      model?: string;
      since?: string;
      until?: string;
      windowDays?: number;
    } = {},
  ): Promise<{
    success: boolean;
    data: QualitySummaryData;
    cached: boolean;
  }> {
    const queryParams = new URLSearchParams();
    if (params.model) queryParams.append('model', params.model);
    if (params.since) queryParams.append('since', params.since);
    if (params.until) queryParams.append('until', params.until);
    if (params.windowDays)
      queryParams.append('windowDays', params.windowDays.toString());

    const endpoint = `/api/quality-summary?${queryParams.toString()}`;
    const result = await this.makeRequest<{
      success: boolean;
      data: QualitySummaryData;
      cached: boolean;
    }>(endpoint);
    return result;
  }
}
