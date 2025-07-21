import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { QUERY_CONFIG } from '../constants/queryConfig.js';
import { ApiClient } from '../api.js';
import Card from '../components/ui/Card.js';
import TimeRangeSelector from '../components/features/dashboard/TimeRangeSelector.js';
import { LoadingSpinner } from '../components/ui/LoadingState.js';
import ErrorMessage from '../components/shared/ErrorMessage.js';
import { DashboardSkeleton } from '../components/ui/Skeleton.js';
import { useDarkModeStore } from '../store/darkModeStore.js';
import type { SimpleDashboardStats } from '../types/dashboard.js';

const DashboardPage = () => {
  const [days, setDays] = useState(30);
  const { isDarkMode } = useDarkModeStore();

  // Use TanStack Query for auto-refresh dashboard data
  const { data, isLoading, error } = useQuery<SimpleDashboardStats>({
    queryKey: ['dashboard', days],
    queryFn: () => ApiClient.fetchDashboardStats(days),
    ...QUERY_CONFIG.DASHBOARD,
  });

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 touch-pan-y overflow-y-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 touch-pan-y overflow-y-auto">
          <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
            <ErrorMessage
              message={
                error instanceof Error
                  ? error.message
                  : 'Failed to load dashboard'
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 touch-pan-y overflow-y-auto">
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-4">
          {/* Compact Header */}
          <div className="mb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                Analytics Dashboard
              </h1>
              <TimeRangeSelector
                selectedDays={days}
                onDaysChange={handleDaysChange}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Main Dashboard Content */}
          {data && !isLoading && !error && (
            <>
              {/* Key Metrics - Enhanced Dark Mode */}
              <div className="mb-3 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Total Evaluations
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      {data.totalJobs.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Active Models
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      {Object.keys(data.modelBreakdown || {}).length}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Total Cost
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      ${data.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Success Rate
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      {data.recentTrends.averageSuccessRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Charts - 2x2 Grid Layout */}
              <div className="grid min-h-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-2">
                {/* Evaluation Activity Trend */}
                <Card
                  title="Recent Activity"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="flex h-56 items-center justify-center sm:h-64">
                    <div className="space-y-4 text-center">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {data.recentTrends.jobsToday}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Jobs Today
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {data.completedJobs}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Completed
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Cost trend: {data.recentTrends.costTrend}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Model Breakdown */}
                <Card
                  title="Model Usage"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="h-56 overflow-y-auto sm:h-64">
                    {Object.keys(data.modelBreakdown || {}).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(data.modelBreakdown).map(
                          ([model, count]) => (
                            <div
                              key={model}
                              className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-700"
                            >
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {model}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {count} jobs
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <span className="text-3xl">🤖</span>
                          <p className="mt-2 text-sm">
                            No model data available
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Token Usage by Model - Vertical Bar Chart */}
                <Card
                  title="Provider Usage"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="h-56 overflow-y-auto sm:h-64">
                    {Object.keys(data.providerBreakdown || {}).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(data.providerBreakdown).map(
                          ([provider, count]) => (
                            <div
                              key={provider}
                              className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-700"
                            >
                              <span className="text-sm font-medium text-gray-700 capitalize dark:text-gray-300">
                                {provider}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {count} jobs
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <span className="text-3xl">🔌</span>
                          <p className="mt-2 text-sm">
                            No provider data available
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Model Efficiency Analysis - Response Time vs Cost */}
                <Card
                  title="Model Efficiency"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="flex h-56 items-center justify-center sm:h-64">
                    <div className="space-y-3 text-center">
                      <span className="text-4xl">⚡</span>
                      <div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                          Coming Soon
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Advanced analytics will be available in future
                          releases
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
