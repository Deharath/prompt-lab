import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DiffViewer from 'react-diff-viewer-continued';
import { ApiClient, type JobDetails as _JobDetails } from '../api.js';
import { useJobStore } from '../store/jobStore.js';
import Card from './ui/Card.js';
import StatCard from './ui/StatCard.js';
import Button from './ui/Button.js';

interface DiffViewProps {
  baseJobId: string;
  compareJobId: string;
  onClose: () => void;
}

const isImprovement = (key: string, delta: number) => {
  const lower = key.toLowerCase();
  if (
    lower.includes('cost') ||
    lower.includes('token') ||
    lower.includes('latency')
  ) {
    return delta <= 0; // lower is better
  }
  return delta >= 0; // higher is better
};

const format = (val: number | undefined) =>
  val === undefined || val === null ? 'N/A' : val.toFixed(3);

const DiffView = ({ baseJobId, compareJobId, onClose }: DiffViewProps) => {
  const { clearComparison } = useJobStore();
  const [activeTab, setActiveTab] = useState<'output' | 'metrics'>('output');

  // Use TanStack Query for diff data
  const {
    data: diff,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['diff', baseJobId, compareJobId],
    queryFn: () => ApiClient.diffJobs(baseJobId, compareJobId),
    enabled: !!(baseJobId && compareJobId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleClose = () => {
    clearComparison();
    onClose();
  };

  if (isLoading) {
    return (
      <Card title="Loading Comparison">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading comparison...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !diff) {
    return (
      <Card title="Comparison Error">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-foreground mb-1">
              Failed to load comparison
            </h3>
            <p className="text-xs text-muted-foreground">
              Please try again or select different jobs
            </p>
          </div>
          <Button onClick={handleClose} variant="secondary" size="sm">
            Close
          </Button>
        </div>
      </Card>
    );
  }

  const { baseJob, compareJob } = diff;
  const baseMetrics = (baseJob.metrics as Record<string, number>) || {};
  const compareMetrics = (compareJob.metrics as Record<string, number>) || {};
  const metricKeys = Array.from(
    new Set([...Object.keys(baseMetrics), ...Object.keys(compareMetrics)]),
  );

  // Calculate metric deltas for StatCards
  const metricStats = metricKeys.map((key) => {
    const baseVal = baseMetrics[key] ?? 0;
    const compareVal = compareMetrics[key] ?? 0;
    const delta = compareVal - baseVal;
    const deltaPercent = baseVal !== 0 ? (delta / baseVal) * 100 : 0;

    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: compareVal,
      delta: deltaPercent,
      isImprovement: isImprovement(key, delta),
      baseValue: baseVal,
      compareValue: compareVal,
      rawDelta: delta,
    };
  });

  return (
    <div className="space-y-6" role="main" aria-label="Job comparison view">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between p-4">
          <div>
            <h2
              className="text-lg font-semibold text-foreground"
              id="comparison-title"
            >
              Job Comparison
            </h2>
            <p
              className="text-sm text-muted-foreground"
              aria-describedby="comparison-title"
            >
              Comparing Job #{baseJobId.substring(0, 8)} vs Job #
              {compareJobId.substring(0, 8)}
            </p>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            aria-label="Close job comparison"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div
        className="flex space-x-1 p-1 bg-muted rounded-lg"
        role="tablist"
        aria-label="Comparison view options"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'output'}
          aria-controls="output-panel"
          id="output-tab"
          onClick={() => setActiveTab('output')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === 'output'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Output Diff
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'metrics'}
          aria-controls="metrics-panel"
          id="metrics-tab"
          onClick={() => setActiveTab('metrics')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            activeTab === 'metrics'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Metrics Comparison
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'output' && (
        <div role="tabpanel" id="output-panel" aria-labelledby="output-tab">
          <Card title="Output Comparison">
            <div className="p-6" role="region" aria-label="Output diff viewer">
              <DiffViewer
                oldValue={baseJob.result || ''}
                newValue={compareJob.result || ''}
                splitView
                leftTitle={`Base Job (${baseJobId.substring(0, 8)})`}
                rightTitle={`Compare Job (${compareJobId.substring(0, 8)})`}
                useDarkTheme={false} // Use light theme to match our design system
                styles={{
                  variables: {
                    light: {
                      diffViewerBackground: '#ffffff',
                      diffViewerColor: '#0f172a',
                      addedBackground: '#dcfce7',
                      addedColor: '#166534',
                      removedBackground: '#fef2f2',
                      removedColor: '#dc2626',
                      wordAddedBackground: '#bbf7d0',
                      wordRemovedBackground: '#fecaca',
                      addedGutterBackground: '#dcfce7',
                      removedGutterBackground: '#fef2f2',
                      gutterBackground: '#f8fafc',
                      gutterBackgroundDark: '#f1f5f9',
                      highlightBackground: '#f1f5f9',
                      highlightGutterBackground: '#e2e8f0',
                    },
                  },
                }}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div role="tabpanel" id="metrics-panel" aria-labelledby="metrics-tab">
          {/* Metrics Overview */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            role="region"
            aria-label="Metrics comparison overview"
          >
            {metricStats.slice(0, 4).map((stat) => (
              <StatCard
                key={stat.key}
                title={stat.label}
                value={
                  typeof stat.value === 'number' ? stat.value.toFixed(3) : 'N/A'
                }
                delta={{
                  value: Math.abs(stat.delta),
                  type:
                    stat.delta > 0
                      ? 'positive'
                      : stat.delta < 0
                        ? 'negative'
                        : 'neutral',
                }}
              />
            ))}
          </div>

          {/* Detailed Metrics Table */}
          <Card title="Detailed Metrics Comparison">
            <div
              className="overflow-x-auto"
              role="region"
              aria-label="Detailed metrics comparison table"
            >
              <table
                className="w-full"
                role="table"
                aria-label="Detailed metrics data"
              >
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      scope="col"
                    >
                      Metric
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      scope="col"
                    >
                      Base
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      scope="col"
                    >
                      Compare
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      scope="col"
                    >
                      Delta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metricStats.map((stat) => (
                    <tr key={stat.key} className="hover:bg-muted/20">
                      <td
                        className="px-4 py-3 text-sm font-medium text-foreground"
                        scope="row"
                      >
                        {stat.label}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(stat.baseValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(stat.compareValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          stat.isImprovement ? 'text-success' : 'text-error'
                        }`}
                      >
                        {stat.rawDelta > 0 ? '+' : ''}
                        {format(stat.rawDelta)}
                      </td>
                    </tr>
                  ))}

                  {/* Additional system metrics */}
                  <tr className="hover:bg-muted/20">
                    <td
                      className="px-4 py-3 text-sm font-medium text-foreground"
                      scope="row"
                    >
                      Cost (USD)
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(baseJob.costUsd)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(compareJob.costUsd)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        isImprovement(
                          'cost',
                          (compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0),
                        )
                          ? 'text-success'
                          : 'text-error'
                      }`}
                    >
                      {(compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0) > 0
                        ? '+'
                        : ''}
                      {format(
                        (compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0),
                      )}
                    </td>
                  </tr>

                  <tr className="hover:bg-muted/20">
                    <td
                      className="px-4 py-3 text-sm font-medium text-foreground"
                      scope="row"
                    >
                      Tokens Used
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {baseJob.tokensUsed ?? 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {compareJob.tokensUsed ?? 'N/A'}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-medium ${
                        isImprovement(
                          'token',
                          (compareJob.tokensUsed ?? 0) -
                            (baseJob.tokensUsed ?? 0),
                        )
                          ? 'text-success'
                          : 'text-error'
                      }`}
                    >
                      {(compareJob.tokensUsed ?? 0) -
                        (baseJob.tokensUsed ?? 0) >
                      0
                        ? '+'
                        : ''}
                      {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DiffView;
