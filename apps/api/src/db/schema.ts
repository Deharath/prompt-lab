export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  prompt: string;
  provider: string;
  model: string;
  status: JobStatus;
  result?: string;
  metrics?: {
    durationMs: number;
    tokenCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type NewJob = Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  status?: JobStatus;
};
