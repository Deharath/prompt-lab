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
