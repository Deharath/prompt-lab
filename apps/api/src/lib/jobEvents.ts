import { EventEmitter } from 'node:events';

type JobEvent =
  | {
      type: 'status';
      status: 'running' | 'evaluating' | 'completed' | 'failed' | 'cancelled';
    }
  | { type: 'token'; content: string }
  | { type: 'metrics'; payload: Record<string, unknown> }
  | { type: 'error'; message: string }
  | { type: 'done' };

class JobEventBus {
  private emitter = new EventEmitter();

  subscribe(jobId: string, listener: (e: JobEvent) => void) {
    const handler = (e: JobEvent) => listener(e);
    this.emitter.on(jobId, handler);
    return () => this.emitter.off(jobId, handler);
  }

  publish(jobId: string, event: JobEvent) {
    this.emitter.emit(jobId, event);
  }
}

export const jobEvents = new JobEventBus();
