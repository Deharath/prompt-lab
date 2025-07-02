export interface DashboardStats {
  scoreHistory: Array<{
    date: string;
    avgScore: number;
  }>;
  costByModel: Array<{
    model: string;
    totalCost: number;
  }>;
}
