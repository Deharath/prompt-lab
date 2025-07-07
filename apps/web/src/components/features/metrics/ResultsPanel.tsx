import { useState, useEffect } from 'react';
import { processMetrics } from './results-panel/metricsProcessor.js';
import { MetricSection } from './results-panel/MetricSection.js';

interface ResultsPanelProps {
  metrics: Record<string, unknown> | undefined;
  jobId?: string;
  title?: string;
  showInsights?: boolean;
}

const ResultsPanel = ({
  metrics,
  jobId: _jobId,
  title = 'Evaluation Results',
  showInsights: _showInsights,
}: ResultsPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('evaluation-panel-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

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

  const categorizedMetrics = processMetrics(metrics);

  return (
    <div className="bg-card border-border rounded-lg border shadow-sm">
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md shadow-sm">
              <svg
                className="h-3 w-3"
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
            <h3 className="text-foreground text-base font-semibold">{title}</h3>
          </div>
          <button
            onClick={toggleCollapse}
            className="text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-md p-1 transition-colors"
            aria-label={isCollapsed ? 'Expand metrics' : 'Collapse metrics'}
          >
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <div className="space-y-4">
            <MetricSection
              title="Quality Metrics"
              icon="🎯"
              metrics={categorizedMetrics.quality}
            />
            <MetricSection
              title="Readability Analysis"
              icon="📖"
              metrics={categorizedMetrics.readability}
            />
            <MetricSection
              title="Sentiment Analysis"
              icon="💭"
              metrics={categorizedMetrics.sentiment}
            />
            <MetricSection
              title="Content Analysis"
              icon="📄"
              metrics={categorizedMetrics.content}
            />
            <MetricSection
              title="Technical Metrics"
              icon="⚙️"
              metrics={categorizedMetrics.technical}
            />

            {Object.values(categorizedMetrics).every(
              (cat: any) => cat.length === 0,
            ) && (
              <div className="text-muted-foreground py-4 text-center">
                <p className="text-sm">No metrics available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
