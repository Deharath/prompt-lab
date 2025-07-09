import React from 'react';
import UnifiedMetricsDisplay from './UnifiedMetricsDisplay.js';
import { type MetricResult } from '@prompt-lab/shared-types';

interface ResultsPanelProps {
  metrics: MetricResult | Record<string, unknown> | undefined;
  jobId?: string;
  title?: string;
  showInsights?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Legacy ResultsPanel component now using UnifiedMetricsDisplay
 * Maintains backward compatibility while using the new optimized implementation
 */
const ResultsPanel: React.FC<ResultsPanelProps> = ({
  metrics,
  jobId: _jobId,
  title = 'Evaluation Results',
  showInsights: _showInsights,
  compact = false,
  className = '',
}) => {
  return (
    <UnifiedMetricsDisplay
      metrics={metrics}
      title={title}
      compact={compact}
      showCategories
      showTooltips
      className={className}
      data-testid="results-panel"
    />
  );
};

export default ResultsPanel;

// For backward compatibility - remove after migration
export { ResultsPanel };
