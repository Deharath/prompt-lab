export const QUERY_CONFIG = {
  JOBS: {
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },

  JOB_DETAILS: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  },

  DASHBOARD: {
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  },

  DIFF: {
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  },
} as const;
