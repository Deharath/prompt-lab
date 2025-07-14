import { useEffect } from 'react';
import { useJobStore } from '../store/jobStore.js';
import { useWorkspaceStore } from '../store/workspaceStore.js';

export const useStateSynchronization = () => {
  const { current: currentJob, metrics, running } = useJobStore();
  const { loadJobData } = useWorkspaceStore();

  // Sync workspace when job changes, but avoid syncing for actively running jobs
  useEffect(() => {
    if (currentJob?.id && !running) {
      // Only load job data if the job is not currently running
      // This prevents interference with active job execution
      const jobStatus = currentJob.status;
      const isActiveJob =
        jobStatus === 'running' ||
        jobStatus === 'pending' ||
        jobStatus === 'evaluating';

      if (!isActiveJob) {
        loadJobData(currentJob.id);
      }
    }
  }, [currentJob?.id, loadJobData, running]);

  // Sync metrics across stores
  useEffect(() => {
    if (metrics) {
      // Note: Metrics are managed in jobStore, workspace store doesn't need them
      // This effect can be extended if cross-store metric sync is needed in the future
    }
  }, [metrics]);
};
