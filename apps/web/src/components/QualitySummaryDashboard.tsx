/**
 * Quality Summary Dashboard Components
 * Display tile cards per model with tooltip metric definitions
 */

import React from 'react';
import {
  useQualitySummary,
  type QualitySummaryData,
} from '../hooks/useQualitySummary.js';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  tooltip?: string;
  darkMode?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  tooltip,
  darkMode = false,
}) => {
  const colorClasses = {
    blue: darkMode
      ? 'border-blue-400/30 bg-blue-900/20 text-blue-100'
      : 'border-blue-200 bg-blue-50 text-blue-900',
    green: darkMode
      ? 'border-green-400/30 bg-green-900/20 text-green-100'
      : 'border-green-200 bg-green-50 text-green-900',
    yellow: darkMode
      ? 'border-yellow-400/30 bg-yellow-900/20 text-yellow-100'
      : 'border-yellow-200 bg-yellow-50 text-yellow-900',
    red: darkMode
      ? 'border-red-400/30 bg-red-900/20 text-red-100'
      : 'border-red-200 bg-red-50 text-red-900',
    purple: darkMode
      ? 'border-purple-400/30 bg-purple-900/20 text-purple-100'
      : 'border-purple-200 bg-purple-50 text-purple-900',
  };

  return (
    <div
      className={`relative p-6 rounded-lg border transition-all duration-200 hover:shadow-lg ${colorClasses[color]}`}
      title={tooltip}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium opacity-75">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="ml-4 opacity-40">{icon}</div>}
      </div>

      {tooltip && (
        <div className="absolute bottom-2 right-2 opacity-30 hover:opacity-100 transition-opacity">
          <span className="text-xs">?</span>
        </div>
      )}
    </div>
  );
};

interface QualitySummaryTileProps {
  data: QualitySummaryData;
  darkMode?: boolean;
  cached?: boolean;
}

const QualitySummaryTile: React.FC<QualitySummaryTileProps> = ({
  data,
  darkMode = false,
  cached = false,
}) => {
  const formatValue = (
    value: number,
    type: 'percentage' | 'score' | 'count' | 'time',
  ) => {
    switch (type) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'score':
        return value.toFixed(2);
      case 'count':
        return value.toLocaleString();
      case 'time':
        return value >= 1000
          ? `${(value / 1000).toFixed(2)}s`
          : `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  };

  const getScoreColor = (score: number): MetricCardProps['color'] => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'yellow';
    return 'red';
  };

  return (
    <div
      className={`p-6 rounded-xl border ${
        darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
      } shadow-lg`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className={`text-xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {data.model}
          </h2>
          <p
            className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {data.period.days} days • {data.metrics.totalJobs} jobs
          </p>
        </div>
        {cached && (
          <span
            className={`px-2 py-1 text-xs rounded ${
              darkMode
                ? 'bg-blue-900/30 text-blue-300 border border-blue-700'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            Cached
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Overall Score"
          value={formatValue(data.metrics.avgScore, 'score')}
          color={getScoreColor(data.metrics.avgScore)}
          tooltip="Average of all quality metrics for this model"
          darkMode={darkMode}
          icon={<span className="text-2xl">📊</span>}
        />

        <MetricCard
          title="Readability"
          value={formatValue(data.metrics.avgReadability, 'score')}
          subtitle="Flesch Reading Ease"
          color={getScoreColor(data.metrics.avgReadability / 100)}
          tooltip="Average readability score (0-100, higher is easier to read)"
          darkMode={darkMode}
          icon={<span className="text-2xl">📖</span>}
        />

        <MetricCard
          title="Sentiment"
          value={formatValue(data.metrics.avgSentiment, 'score')}
          subtitle="Emotional Tone"
          color={
            data.metrics.avgSentiment > 0
              ? 'green'
              : data.metrics.avgSentiment < 0
                ? 'red'
                : 'yellow'
          }
          tooltip="Average sentiment (-1 negative to +1 positive)"
          darkMode={darkMode}
          icon={<span className="text-2xl">😊</span>}
        />

        <MetricCard
          title="Success Rate"
          value={formatValue(data.metrics.successRate, 'percentage')}
          color={getScoreColor(data.metrics.successRate)}
          tooltip="Percentage of jobs completed successfully"
          darkMode={darkMode}
          icon={<span className="text-2xl">✅</span>}
        />

        <MetricCard
          title="Total Jobs"
          value={formatValue(data.metrics.totalJobs, 'count')}
          color="blue"
          tooltip="Total number of completed jobs in this period"
          darkMode={darkMode}
          icon={<span className="text-2xl">📝</span>}
        />

        {data.metrics.p95_latency_ms && (
          <MetricCard
            title="P95 Latency"
            value={formatValue(data.metrics.p95_latency_ms, 'time')}
            subtitle="95th percentile"
            color={
              data.metrics.p95_latency_ms > 2000
                ? 'red'
                : data.metrics.p95_latency_ms > 1000
                  ? 'yellow'
                  : 'green'
            }
            tooltip="95% of requests complete within this time"
            darkMode={darkMode}
            icon={<span className="text-2xl">⚡</span>}
          />
        )}
      </div>

      <div
        className={`mt-4 text-xs ${
          darkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        Updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

interface QualitySummaryDashboardProps {
  model?: string;
  windowDays?: number;
  darkMode?: boolean;
}

export const QualitySummaryDashboard: React.FC<
  QualitySummaryDashboardProps
> = ({ model, windowDays = 7, darkMode = false }) => {
  const { data, loading, error, cached, refresh } = useQualitySummary({
    model,
    windowDays,
  });

  if (loading) {
    return (
      <div
        className={`p-8 rounded-xl border ${
          darkMode
            ? 'border-gray-700 bg-gray-800/50'
            : 'border-gray-200 bg-white'
        } shadow-lg`}
      >
        <div className="animate-pulse">
          <div
            className={`h-6 rounded mb-4 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-24 rounded ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-8 rounded-xl border ${
          darkMode
            ? 'border-red-700 bg-red-900/20 text-red-100'
            : 'border-red-200 bg-red-50 text-red-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Failed to load quality summary</h3>
            <p className="text-sm opacity-75 mt-1">{error}</p>
          </div>
          <button
            onClick={refresh}
            className={`px-4 py-2 rounded ${
              darkMode
                ? 'bg-red-800 hover:bg-red-700 text-red-100'
                : 'bg-red-100 hover:bg-red-200 text-red-800'
            } transition-colors`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`p-8 rounded-xl border ${
          darkMode
            ? 'border-gray-700 bg-gray-800/50 text-gray-400'
            : 'border-gray-200 bg-gray-50 text-gray-600'
        }`}
      >
        <p>No quality data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className={`text-2xl font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          Quality Summary
        </h2>
        <button
          onClick={refresh}
          className={`px-4 py-2 rounded ${
            darkMode
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          } transition-colors`}
        >
          Refresh
        </button>
      </div>

      <QualitySummaryTile data={data} darkMode={darkMode} cached={cached} />
    </div>
  );
};

export default QualitySummaryDashboard;
