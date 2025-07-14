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
import { ApiClient } from '../api.js';
import Card from '../components/ui/Card.js';
import TimeRangeSelector from '../components/features/dashboard/TimeRangeSelector.js';
import { LoadingSpinner } from '../components/ui/LoadingState.js';
import ErrorMessage from '../components/shared/ErrorMessage.js';
import { DashboardSkeleton } from '../components/ui/Skeleton.js';
import { useDarkModeStore } from '../store/darkModeStore.js';
import type { DashboardStats } from '../types/dashboard.js';

const DashboardPage = () => {
  const [days, setDays] = useState(30);
  const { isDarkMode } = useDarkModeStore();

  // Use TanStack Query for auto-refresh dashboard data
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard', days],
    queryFn: () => ApiClient.fetchDashboardStats(days),
    staleTime: 1000 * 10, // 10 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
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
                      {data.scoreHistory
                        .reduce((sum, item) => sum + item.totalJobs, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Active Models
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      {data.tokensByModel?.length ||
                        data.estimatedCostByModel?.length ||
                        0}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Total Cost
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      $
                      {(
                        data.estimatedCostByModel?.reduce(
                          (sum, item) => sum + item.estimatedCost,
                          0,
                        ) || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition-colors sm:p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Avg Daily Tests
                    </p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl dark:text-white">
                      {Math.round(
                        data.scoreHistory.reduce(
                          (sum, item) => sum + item.totalJobs,
                          0,
                        ) / data.scoreHistory.length,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Analytics Charts - 2x2 Grid Layout */}
              <div className="grid min-h-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-2">
                {/* Evaluation Activity Trend */}
                <Card
                  title="Evaluation Activity"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.scoreHistory}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="date"
                          className="text-gray-600 dark:text-gray-400"
                          fontSize={11}
                        />
                        <YAxis
                          className="text-gray-600 dark:text-gray-400"
                          fontSize={11}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode
                              ? 'rgba(31, 41, 55, 0.95)'
                              : 'rgba(255, 255, 255, 0.95)',
                            border: isDarkMode
                              ? '1px solid #4b5563'
                              : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: isDarkMode ? '#f9fafb' : '#111827',
                          }}
                          formatter={(value: number) => [value, 'Evaluations']}
                          labelFormatter={(label: string) => label}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalJobs"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                          activeDot={{
                            r: 5,
                            stroke: '#3b82f6',
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Cost by Model - Vertical Bar Chart */}
                <Card
                  title="Cost by Model"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="h-56 sm:h-64">
                    {data.estimatedCostByModel &&
                    data.estimatedCostByModel.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.estimatedCostByModel}
                          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
                          <XAxis
                            dataKey="model"
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <YAxis
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={11}
                            tickFormatter={(value) =>
                              typeof value === 'number'
                                ? `$${value.toFixed(2)}`
                                : value
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode
                                ? 'rgba(31, 41, 55, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                              border: isDarkMode
                                ? '1px solid #4b5563'
                                : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: isDarkMode ? '#f9fafb' : '#111827',
                            }}
                            formatter={(value: number) => [
                              `$${value.toFixed(4)}`,
                              'Cost',
                            ]}
                          />
                          <Bar
                            dataKey="estimatedCost"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <span className="text-3xl">💰</span>
                          <p className="mt-2 text-sm">No cost data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Token Usage by Model - Vertical Bar Chart */}
                <Card
                  title="Token Usage by Model"
                  className="h-72 bg-white p-3 sm:h-80 sm:p-4 dark:bg-gray-800"
                >
                  <div className="h-56 sm:h-64">
                    {data.tokensByModel && data.tokensByModel.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.tokensByModel}
                          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
                          <XAxis
                            dataKey="model"
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <YAxis
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={11}
                            tickFormatter={(value) =>
                              typeof value === 'number'
                                ? `${(value / 1000).toFixed(0)}K`
                                : value
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode
                                ? 'rgba(31, 41, 55, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                              border: isDarkMode
                                ? '1px solid #4b5563'
                                : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '13px',
                              color: isDarkMode ? '#f9fafb' : '#111827',
                            }}
                            formatter={(value: number) => [
                              value.toLocaleString(),
                              'Tokens',
                            ]}
                          />
                          <Bar
                            dataKey="totalTokens"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <span className="text-3xl">🪙</span>
                          <p className="mt-2 text-sm">
                            No token data available
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
                  <div className="h-56 sm:h-64">
                    {data.modelEfficiency && data.modelEfficiency.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart
                          data={data.modelEfficiency}
                          margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="opacity-30"
                          />
                          <XAxis
                            type="number"
                            dataKey="avgResponseTime"
                            name="Response Time"
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={11}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tickFormatter={(value) =>
                              typeof value === 'number'
                                ? `${value.toFixed(0)}ms`
                                : value
                            }
                          />
                          <YAxis
                            type="number"
                            dataKey="costPerToken"
                            name="Cost per Token"
                            className="text-gray-600 dark:text-gray-400"
                            fontSize={11}
                            tickFormatter={(value) =>
                              typeof value === 'number'
                                ? `$${(value * 1000).toFixed(3)}`
                                : value
                            }
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length > 0) {
                                const data = payload[0].payload;
                                return (
                                  <div
                                    className="rounded-lg border p-3 shadow-lg"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? 'rgba(31, 41, 55, 0.95)'
                                        : 'rgba(255, 255, 255, 0.95)',
                                      border: isDarkMode
                                        ? '1px solid #4b5563'
                                        : '1px solid #e5e7eb',
                                      color: isDarkMode ? '#f9fafb' : '#111827',
                                    }}
                                  >
                                    <div className="mb-2 font-semibold">
                                      {data.model || 'Unknown Model'}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                      <div>
                                        Response Time:{' '}
                                        {data.avgResponseTime?.toFixed(0)}ms
                                      </div>
                                      <div>
                                        Cost: $
                                        {(data.costPerToken * 1000).toFixed(4)}
                                        /K tokens
                                      </div>
                                      <div>
                                        Total Jobs: {data.totalJobs || 0}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter dataKey="costPerToken" fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <span className="text-3xl">⚡</span>
                          <p className="mt-2 text-sm">
                            No efficiency data available
                          </p>
                        </div>
                      </div>
                    )}
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