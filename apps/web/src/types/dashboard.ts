export interface DashboardStats {
  scoreHistory: Array<{
    date: string;
    avgReadability: number;
    totalJobs: number;
  }>;
  costByModel: Array<{
    model: string;
    totalCost: number;
  }>;
  tokensByModel: Array<{
    model: string;
    totalTokens: number;
  }>;
  estimatedCostByModel: Array<{
    model: string;
    estimatedCost: number;
  }>;
  modelEfficiency: Array<{
    model: string;
    avgResponseTime: number;
    costPerToken: number;
    totalJobs: number;
  }>;
}

// Simple dashboard stats interface matching current API reality
export interface SimpleDashboardStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalCost: number;
  averageResponseTime: number;
  providerBreakdown: Record<string, number>;
  modelBreakdown: Record<string, number>;
  recentTrends: {
    jobsToday: number;
    costTrend: string;
    averageSuccessRate: number;
  };
}
