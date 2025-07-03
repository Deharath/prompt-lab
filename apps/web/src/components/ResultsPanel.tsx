import Card from './ui/Card.js';
import StatCard from './ui/StatCard.js';
import ShareRunButton from './ShareRunButton.js';
import { useState, useEffect } from 'react';

interface ResultsPanelProps {
  metrics: Record<string, unknown> | undefined;
  jobId?: string;
}

const ResultsPanel = ({ metrics, jobId }: ResultsPanelProps) => {
  // Add collapsible state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('evaluation-panel-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem(
      'evaluation-panel-collapsed',
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  // Only use valid, finite numbers for metrics
  const metricEntries = Object.entries(metrics).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === 'number' && Number.isFinite(entry[1]),
  );
  if (metricEntries.length === 0) return null;

  // Categorize metrics into groups for better organization
  const categorizeMetrics = (entries: [string, number][]) => {
    const categories = {
      quality: [] as [string, number][],
      performance: [] as [string, number][],
      cost: [] as [string, number][],
      classification: [] as [string, number][],
      other: [] as [string, number][],
    };

    entries.forEach(([name, value]) => {
      const lowerName = name.toLowerCase();

      if (
        lowerName.includes('precision') ||
        lowerName.includes('recall') ||
        lowerName.includes('f_score') ||
        lowerName.includes('fscore')
      ) {
        categories.classification.push([name, value]);
      } else if (
        lowerName.includes('latency') ||
        lowerName.includes('time') ||
        lowerName.includes('speed')
      ) {
        categories.performance.push([name, value]);
      } else if (
        lowerName.includes('cost') ||
        lowerName.includes('usd') ||
        lowerName.includes('price')
      ) {
        categories.cost.push([name, value]);
      } else if (
        lowerName.includes('score') ||
        lowerName.includes('sim') ||
        lowerName.includes('flesch') ||
        lowerName.includes('sentiment') ||
        lowerName.includes('validity')
      ) {
        categories.quality.push([name, value]);
      } else {
        categories.other.push([name, value]);
      }
    });

    return categories;
  };

  const categorizedMetrics = categorizeMetrics(metricEntries);

  // Helper function to format metric display
  const formatMetricValue = (name: string, value: number) => {
    const lowerName = name.toLowerCase();

    // Percentage values (0-1 range)
    if (
      (lowerName.includes('precision') ||
        lowerName.includes('recall') ||
        lowerName.includes('f_score') ||
        lowerName.includes('sim') ||
        (lowerName.includes('score') && value <= 1)) &&
      value >= 0 &&
      value <= 1
    ) {
      return `${(value * 100).toFixed(1)}%`;
    }

    // Currency values
    if (lowerName.includes('cost') || lowerName.includes('usd')) {
      return `$${value.toFixed(4)}`;
    }

    // Time values (assume milliseconds)
    if (lowerName.includes('latency') || lowerName.includes('time')) {
      return `${value.toFixed(0)}ms`;
    }

    // Token counts and other integers
    if (
      lowerName.includes('tokens') ||
      lowerName.includes('count') ||
      lowerName.includes('words')
    ) {
      return Math.round(value).toLocaleString();
    }

    // Default: 3 decimal places
    return value.toFixed(3);
  };

  // Helper function to get appropriate icon for metric categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'classification':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cost':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246C12.196 9.434 11.622 9.209 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246C7.804 10.566 8.378 10.791 9 10.908v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246C12.196 9.434 11.622 9.209 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5a1 1 0 10-2 0v.092z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'quality':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'classification':
        return 'Classification Metrics';
      case 'performance':
        return 'Performance Metrics';
      case 'cost':
        return 'Cost Metrics';
      case 'quality':
        return 'Quality Metrics';
      default:
        return 'Other Metrics';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'classification':
        return 'from-green-500 to-emerald-600';
      case 'performance':
        return 'from-blue-500 to-indigo-600';
      case 'cost':
        return 'from-pink-500 to-rose-600';
      case 'quality':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  // Calculate summary statistics
  const classificationMetrics = categorizedMetrics.classification;
  const hasClassificationMetrics = classificationMetrics.length > 0;
  const avgClassificationScore = hasClassificationMetrics
    ? classificationMetrics.reduce((sum, [, value]) => sum + value, 0) /
      classificationMetrics.length
    : 0;

  return (
    <Card title="Evaluation Results">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Evaluation Results
            </h2>
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={
                isCollapsed
                  ? 'Expand evaluation results'
                  : 'Collapse evaluation results'
              }
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
          {jobId && <ShareRunButton jobId={jobId} />}
        </div>

        {/* Summary Statistics */}
        {!isCollapsed && hasClassificationMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Avg Classification Score"
              value={formatMetricValue('score', avgClassificationScore)}
              icon={getCategoryIcon('classification')}
            />
            <StatCard
              title="Total Metrics"
              value={metricEntries.length.toString()}
              icon={getCategoryIcon('other')}
            />
            <StatCard
              title="Metric Categories"
              value={Object.values(categorizedMetrics)
                .filter((cat) => cat.length > 0)
                .length.toString()}
              icon={getCategoryIcon('quality')}
            />
          </div>
        )}

        {/* Metrics by Category */}
        {!isCollapsed &&
          Object.entries(categorizedMetrics).map(
            ([category, categoryMetrics]) => {
              if (categoryMetrics.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${getCategoryColor(category)} text-white shadow-sm`}
                    >
                      {getCategoryIcon(category)}
                    </div>
                    <h3 className="text-lg font-semibold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                      {getCategoryTitle(category)}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({categoryMetrics.length} metric
                      {categoryMetrics.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryMetrics.map(([name, value]) => (
                      <StatCard
                        key={name}
                        title={name
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/^./, (str) => str.toUpperCase())}
                        value={formatMetricValue(name, value)}
                        icon={getCategoryIcon(category)}
                      />
                    ))}
                  </div>
                </div>
              );
            },
          )}
      </div>
    </Card>
  );
};

export default ResultsPanel;
