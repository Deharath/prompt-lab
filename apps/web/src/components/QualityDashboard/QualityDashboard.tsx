/**
 * Quality Summary Dashboard Component
 * Task 8 - React UI using existing client and useQualitySummary hook
 */

import React, { useState } from 'react';
import { useQualitySummary } from '../../hooks/useQualitySummary.js';
import './QualityDashboard.css';

interface QualityTileProps {
  title: string;
  value: number | string;
  tooltip?: string;
  format?: 'number' | 'percentage' | 'milliseconds';
  status?: 'good' | 'warning' | 'error';
}

const QualityTile: React.FC<QualityTileProps> = ({
  title,
  value,
  tooltip,
  format = 'number',
  status = 'good',
}) => {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'milliseconds':
        return `${Math.round(val)}ms`;
      default:
        return typeof val === 'number' ? val.toFixed(2) : val;
    }
  };

  return (
    <div className={`quality-tile quality-tile--${status}`} title={tooltip}>
      <div className="quality-tile__title">{title}</div>
      <div className="quality-tile__value">{formatValue(value)}</div>
    </div>
  );
};

interface QualityDashboardProps {
  className?: string;
}

export const QualityDashboard: React.FC<QualityDashboardProps> = ({
  className,
}) => {
  const [filters, setFilters] = useState({
    model: '',
    windowDays: 7,
  });

  const { data, loading, error, cached, refresh } = useQualitySummary({
    model: filters.model || undefined,
    windowDays: filters.windowDays,
  });

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, model: event.target.value }));
  };

  const handleWindowChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      windowDays: parseInt(event.target.value, 10),
    }));
  };

  if (loading) {
    return (
      <div className={`quality-dashboard ${className || ''}`}>
        <div className="quality-dashboard__loading">
          <div className="loading-spinner" />
          <span>Loading quality metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`quality-dashboard ${className || ''}`}>
        <div className="quality-dashboard__error">
          <h3>Unable to load quality metrics</h3>
          <p>{error}</p>
          <button onClick={refresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`quality-dashboard ${className || ''}`}>
        <div className="quality-dashboard__offline">
          <h3>Quality Metrics Unavailable</h3>
          <p>
            Unable to connect to the metrics service. Please check your
            connection and try again.
          </p>
          <button onClick={refresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quality-dashboard ${className || ''}`}>
      <div className="quality-dashboard__header">
        <h2>Quality Summary</h2>
        <div className="quality-dashboard__controls">
          <div className="control-group">
            <label htmlFor="model-select">Model:</label>
            <select
              id="model-select"
              value={filters.model}
              onChange={handleModelChange}
            >
              <option value="">All Models</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="window-select">Time Window:</label>
            <select
              id="window-select"
              value={filters.windowDays}
              onChange={handleWindowChange}
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last week</option>
              <option value={30}>Last month</option>
              <option value={90}>Last 3 months</option>
            </select>
          </div>

          <button onClick={refresh} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>

      <div className="quality-dashboard__info">
        <div className="info-row">
          <span>
            Period: {new Date(data.period.start).toLocaleDateString()} -{' '}
            {new Date(data.period.end).toLocaleDateString()}
          </span>
          <span>Model: {data.model}</span>
          {cached && <span className="cached-indicator">Cached data</span>}
        </div>
      </div>

      <div className="quality-dashboard__metrics">
        <QualityTile
          title="Total Jobs"
          value={data.metrics.totalJobs}
          tooltip="Total number of completed jobs in the selected period"
          status={data.metrics.totalJobs > 0 ? 'good' : 'warning'}
        />

        <QualityTile
          title="Average Score"
          value={data.metrics.avgScore}
          tooltip="Combined average of readability and sentiment scores"
          format="number"
          status={
            data.metrics.avgScore > 0.7
              ? 'good'
              : data.metrics.avgScore > 0.5
                ? 'warning'
                : 'error'
          }
        />

        <QualityTile
          title="Readability"
          value={data.metrics.avgReadability}
          tooltip="Average Flesch Reading Ease score (higher is better)"
          format="number"
          status={
            data.metrics.avgReadability > 60
              ? 'good'
              : data.metrics.avgReadability > 30
                ? 'warning'
                : 'error'
          }
        />

        <QualityTile
          title="Sentiment"
          value={data.metrics.avgSentiment}
          tooltip="Average sentiment score (-1 to 1, higher is more positive)"
          format="number"
          status={
            data.metrics.avgSentiment > 0.1
              ? 'good'
              : data.metrics.avgSentiment > -0.1
                ? 'warning'
                : 'error'
          }
        />

        <QualityTile
          title="Success Rate"
          value={data.metrics.successRate}
          tooltip="Percentage of jobs that completed successfully"
          format="percentage"
          status={
            data.metrics.successRate > 0.95
              ? 'good'
              : data.metrics.successRate > 0.8
                ? 'warning'
                : 'error'
          }
        />

        {data.metrics.p95_latency_ms !== undefined && (
          <QualityTile
            title="P95 Latency"
            value={data.metrics.p95_latency_ms}
            tooltip="95th percentile response time"
            format="milliseconds"
            status={
              data.metrics.p95_latency_ms < 2000
                ? 'good'
                : data.metrics.p95_latency_ms < 5000
                  ? 'warning'
                  : 'error'
            }
          />
        )}
      </div>

      <div className="quality-dashboard__footer">
        <small>Last updated: {new Date(data.timestamp).toLocaleString()}</small>
      </div>
    </div>
  );
};

export default QualityDashboard;
