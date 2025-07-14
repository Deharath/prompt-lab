export class JobCancellationManager {
  private static instance: JobCancellationManager;
  private cancelledJobs = new Set<string>();

  static getInstance(): JobCancellationManager {
    if (!JobCancellationManager.instance) {
      JobCancellationManager.instance = new JobCancellationManager();
    }
    return JobCancellationManager.instance;
  }

  cancelJob(jobId: string): void {
    this.cancelledJobs.add(jobId);
  }

  isJobCancelled(jobId: string): boolean {
    return this.cancelledJobs.has(jobId);
  }

  removeJob(jobId: string): void {
    this.cancelledJobs.delete(jobId);
  }
}
