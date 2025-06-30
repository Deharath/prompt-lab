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
    onMessage: (line: string) => void,
    onDone: () => void,
    onError?: (error: Error) => void,
  ): EventSource {
    console.log('🌊 Starting EventSource for job:', id);
    const es = new EventSource(`/jobs/${id}/stream`);

    es.onopen = () => {
      console.log('🔗 EventSource connection opened');
    };

    es.onmessage = (e) => {
      console.log('📡 EventSource message:', e.data);
      if (e.data === '[DONE]') {
        console.log('✅ Received [DONE], closing stream');
        onDone();
        es.close();
      } else {
        onMessage(e.data);
      }
    };

    es.onerror = (e) => {
      console.error('❌ EventSource error:', e);
      const error = new Error('Stream connection failed');

      if (onError) {
        onError(error);
      }

      es.close();

      // Only call onDone if it's a real error, not just a normal close
      if (es.readyState === EventSource.CLOSED) {
        onDone();
      }
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
