export class SSEConnectionPool {
  private static instance: SSEConnectionPool;
  private connections = new Map<string, EventSource>();
  private connectionRefCounts = new Map<string, number>();

  static getInstance(): SSEConnectionPool {
    if (!SSEConnectionPool.instance) {
      SSEConnectionPool.instance = new SSEConnectionPool();
    }
    return SSEConnectionPool.instance;
  }

  getConnection(jobId: string): EventSource {
    if (!this.connections.has(jobId)) {
      this.connections.set(jobId, new EventSource(`/api/jobs/${jobId}/stream`));
      this.connectionRefCounts.set(jobId, 0);
    }

    const refCount = this.connectionRefCounts.get(jobId)! + 1;
    this.connectionRefCounts.set(jobId, refCount);

    return this.connections.get(jobId)!;
  }

  releaseConnection(jobId: string): void {
    const refCount = this.connectionRefCounts.get(jobId) || 0;
    if (refCount <= 1) {
      this.closeConnection(jobId);
    } else {
      this.connectionRefCounts.set(jobId, refCount - 1);
    }
  }

  private closeConnection(jobId: string): void {
    const connection = this.connections.get(jobId);
    if (connection) {
      connection.close();
      this.connections.delete(jobId);
      this.connectionRefCounts.delete(jobId);
    }
  }
}
