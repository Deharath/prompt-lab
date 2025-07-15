import { ApiClient } from '../api.js';
import { JobService } from './jobService.js';
import { SSEConnectionPool } from '../lib/sseConnectionPool.js';

export class StreamingService {
  constructor(
    private jobService: JobService,
    private onToken: (token: string) => void,
    private onStatusChange: (status: string) => void,
    private onError: (error: Error) => void,
  ) {}

  async startStreaming(jobId: string): Promise<void> {
    const eventSource = SSEConnectionPool.getInstance().getConnection(jobId);

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.token) {
          this.onToken(data.token);
        }
      } catch (error) {
        this.onError(error instanceof Error ? error : new Error('Parse error'));
      }
    };

    eventSource.addEventListener('status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status) {
          this.onStatusChange(data.status);
        }
      } catch (error) {
        this.onError(error instanceof Error ? error : new Error('Parse error'));
      }
    });

    eventSource.addEventListener('error', () => {
      this.onError(new Error('Streaming connection failed'));
    });
  }

  stopStreaming(jobId: string): void {
    SSEConnectionPool.getInstance().releaseConnection(jobId);
  }
}
