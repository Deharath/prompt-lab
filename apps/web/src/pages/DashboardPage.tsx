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
import TimeRangeSelector from '../components/TimeRangeSelector.js';
import { LoadingSpinner } from '../components/ui/LoadingState.js';
import ErrorMessage from '../components/ErrorMessage.js';
import { QualitySummaryDashboard } from '../components/QualitySummaryDashboard.js';

const DashboardPage = () => {
  const { isLoading, error, data, days, fetchDashboardStats } =
    useDashboardStore();

  useEffect(() => {
    // Fetch initial data on component mount
    fetchDashboardStats(30);
  }, [fetchDashboardStats]);

  const handleDaysChange = (newDays: number) => {
    fetchDashboardStats(newDays);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-gray-100 dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            View your job performance metrics and model costs over time
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Time Range
            </h2>
            <TimeRangeSelector
              selectedDays={days}
              onDaysChange={handleDaysChange}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} />}

        {data && !isLoading && !error && (
          <>
            {/* Quality Summary Dashboard - New Metrics System */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quality Metrics Summary
              </h2>
              <QualitySummaryDashboard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Average Score Over Time Chart */}
              <Card title="Average Score Over Time" className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.scoreHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="date"
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                      />
                      <YAxis
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Total Cost by Model Chart */}
              <Card title="Total Cost by Model" className="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.costByModel}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="model"
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                      />
                      <YAxis
                        className="text-gray-600 dark:text-gray-400"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                        formatter={(value: number) => [
                          `$${value.toFixed(4)}`,
                          'Total Cost',
                        ]}
                      />
                      <Bar
                        dataKey="totalCost"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
