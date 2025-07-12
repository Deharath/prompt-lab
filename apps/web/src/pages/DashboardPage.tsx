import { useEffect } from 'react';
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
} from 'recharts';
import { useDashboardStore } from '../store/dashboardStore.js';
import Card from '../components/ui/Card.js';
import TimeRangeSelector from '../components/features/dashboard/TimeRangeSelector.js';
import { LoadingSpinner } from '../components/ui/LoadingState.js';
import ErrorMessage from '../components/shared/ErrorMessage.js';
import { useDarkModeStore } from '../store/darkModeStore.js';

const DashboardPage = () => {
  const { isLoading, error, data, days, fetchDashboardStats } =
    useDashboardStore();
  const { isDarkMode } = useDarkModeStore();

  useEffect(() => {
    fetchDashboardStats(30);
  }, [fetchDashboardStats]);

  const handleDaysChange = (newDays: number) => {
    fetchDashboardStats(newDays);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-2">
          {/* Compact Header */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Analytics Dashboard
              </h1>
              <TimeRangeSelector
                selectedDays={days}
                onDaysChange={handleDaysChange}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Loading/Error States */}
          {isLoading && <LoadingSpinner data-testid="loading-spinner" />}
          {error && <ErrorMessage message={error} />}

          {/* Main Dashboard Content */}
          {data && !isLoading && !error && (
            <>
              {/* Key Metrics - Enhanced Dark Mode */}
              <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Total Evaluations
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {data.scoreHistory
                        .reduce((sum, item) => sum + item.totalJobs, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Active Models
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {data.tokensByModel?.length ||
                        data.estimatedCostByModel?.length ||
                        0}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Total Cost
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
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

                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors dark:border-gray-600 dark:bg-gray-800">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Avg Daily Tests
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
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

              {/* Analytics Charts - Improved Space Utilization */}
              <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-2">
                {/* Evaluation Activity Trend */}
                <Card
                  title="Evaluation Activity"
                  className="h-80 bg-white p-4 dark:bg-gray-800"
                >
                  <div className="h-64">
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
                  className="h-80 bg-white p-4 dark:bg-gray-800"
                >
                  <div className="h-64">
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
                  className="h-80 bg-white p-4 dark:bg-gray-800"
                >
                  <div className="h-64">
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
