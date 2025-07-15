// Simple WebSocket interface to avoid external dependencies
interface WebSocket {
  readyState: number;
  send(data: string): void;
}

// WebSocket ready states
const WebSocketReadyState = {
  OPEN: 1,
} as const;

export class WebSocketJobManager {
  private static instance: WebSocketJobManager;
  private connections = new Map<string, WebSocket>();

  static getInstance(): WebSocketJobManager {
    if (!WebSocketJobManager.instance) {
      WebSocketJobManager.instance = new WebSocketJobManager();
    }
    return WebSocketJobManager.instance;
  }

  addConnection(jobId: string, ws: WebSocket): void {
    this.connections.set(jobId, ws);
  }

  removeConnection(jobId: string): void {
    this.connections.delete(jobId);
  }

  notifyJobCancelled(jobId: string): void {
    const ws = this.connections.get(jobId);
    if (ws && ws.readyState === WebSocketReadyState.OPEN) {
      ws.send(JSON.stringify({ type: 'job_cancelled', jobId }));
    }
  }
}
