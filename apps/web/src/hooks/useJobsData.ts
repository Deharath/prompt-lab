import { useQuery } from '@tanstack/react-query';
import { ApiClient } from '../api.js';
import { QUERY_CONFIG } from '../constants/queryConfig.js';

export const useJobsData = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => ApiClient.listJobs(),
    ...QUERY_CONFIG.JOBS,
  });
};

export const useJobDetails = (jobId: string) => {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => ApiClient.fetchJob(jobId),
    enabled: !!jobId,
    ...QUERY_CONFIG.JOB_DETAILS,
  });
};
