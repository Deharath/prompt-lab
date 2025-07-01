export interface JobRequest {
  prompt: string;
  provider: string;
  model: string;
}

export interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface JobResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  metrics?: Record<string, unknown>;
  tokensUsed?: number;
  costUsd?: number;
}

export interface JobDetails extends JobResult {
  prompt: string;
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

        try {
          const errorData: ApiError = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code;
        } catch {
          // If we can't parse JSON, use the response text
          errorMessage = (await response.text()) || `HTTP ${response.status}`;
        }

        const error = new Error(errorMessage) as Error & {
          code?: string;
          status?: number;
        };
        error.code = errorCode;
        error.status = response.status;
        throw error;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static async createJob(body: JobRequest): Promise<JobSummary> {
    console.log('🚀 Creating job with:', body);

    const result = await this.makeRequest<JobSummary>('/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('✅ Job created:', result);
    return result;
  }

  static async fetchJob(id: string): Promise<JobResult> {
    console.log('📊 Fetching job:', id);

    const result = await this.makeRequest<JobResult>(`/jobs/${id}`);

    console.log('✅ Job fetched:', result);
    return result;
  }

  static streamJob(
    id: string,
    onMessage: (token: string) => void,
    onDone: () => void,
    onError?: (error: Error) => void,
    onMetrics?: (metrics: Record<string, unknown>) => void,
  ): EventSource {
    console.log('🌊 Starting EventSource for job:', id);
    const es = new EventSource(`/jobs/${id}/stream`);
    let done = false;

    es.onopen = () => {
      console.log('🔗 EventSource connection opened');
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('📡 SSE event received:', { type: e.type, data });

        if (data.token) {
          onMessage(data.token);
        }
        if (data.error && onError) {
          console.log('❌ Stream error:', data.error);
          onError(new Error(data.error));
        }
      } catch (_err) {
        console.warn('Non-JSON SSE event:', e.data);
      }
    };

    // Handle specific event types
    es.addEventListener('metrics', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log('📊 Metrics received:', data);
        if (onMetrics) {
          onMetrics(data);
        }
      } catch (_err) {
        console.warn('Failed to parse metrics event:', e.data);
      }
    });

    es.addEventListener('done', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log('✅ Done event received:', data);
        done = true;
        onDone();
        es.close();
      } catch (_err) {
        console.warn('Failed to parse done event:', e.data);
      }
    });

    es.addEventListener('error', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log('❌ Error event received:', data);
        if (onError) {
          onError(new Error(data.error || 'Stream error'));
        }
      } catch (_err) {
        console.warn('Failed to parse error event:', e.data);
      }
    });

    es.onerror = (e) => {
      console.error('❌ EventSource connection error:', e);
      // Only call onError if the stream didn't complete normally
      if (!done && onError) {
        const error = new Error('Stream connection failed');
        onError(error);
      }
      es.close();
    };

    return es;
  }

  static async listJobs(): Promise<JobSummary[]> {
    console.log('📜 Fetching job history');
    const result = await this.makeRequest<JobSummary[]>('/jobs');
    console.log('✅ Job history fetched:', result);
    return result;
  }

  static async diffJobs(
    baseId: string,
    compareId: string,
  ): Promise<{ baseJob: JobDetails; compareJob: JobDetails }> {
    console.log('📊 Diffing jobs:', baseId, compareId);
    const endpoint = `/jobs/${baseId}/diff?otherId=${compareId}`;
    const result = await this.makeRequest<{
      baseJob: JobDetails;
      compareJob: JobDetails;
    }>(endpoint);
    console.log('✅ Jobs diff fetched:', result);
    return result;
  }
}

// Legacy exports for backward compatibility
export const createJob = ApiClient.createJob.bind(ApiClient);
export const fetchJob = ApiClient.fetchJob.bind(ApiClient);
export const streamJob = ApiClient.streamJob.bind(ApiClient);
export const listJobs = ApiClient.listJobs.bind(ApiClient);
export const diffJobs = ApiClient.diffJobs.bind(ApiClient);
