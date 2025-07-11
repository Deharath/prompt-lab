/**
 * UnifiedPanelResults - Restored old evaluation panel with centralized system
 * Brings back the beloved old panel design with modern metrics system integration
 */

import React from 'react';
import { type MetricResult } from '@prompt-lab/shared-types';
import { processMetrics } from '../../../../lib/metrics/processor.js';

interface UnifiedPanelResultsProps {
  metrics: MetricResult | Record<string, unknown> | null | undefined;
  compact?: boolean;
  className?: string;
}

const renderMetric = (
  name: string,
  value: string,
  unit?: string,
  description?: string,
  isWide?: boolean,
  isDisabled?: boolean,
) => (
  <div
    key={name}
    className={`bg-muted/20 border-border/50 flex min-h-[60px] flex-col rounded-md border p-3 ${
      isWide ? 'col-span-2' : ''
    } ${isDisabled ? 'opacity-60' : ''}`}
  >
    <div className="mb-2 flex items-start space-x-2">
      <div className="flex-1">
        <h5 className="text-foreground/80 text-xs leading-tight font-medium">
          {name}
        </h5>
      </div>
      {description && (
        <div
          className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30 flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded-full border text-xs"
          title={description}
        >
          ?
        </div>
      )}
    </div>
    <div className="flex flex-1 items-center">
      <div
        className={`text-foreground text-sm leading-tight font-semibold ${
          isDisabled ? 'text-muted-foreground' : ''
        }`}
      >
        {value}
      </div>
      {unit && (
        <span className="text-muted-foreground ml-1 flex-shrink-0 text-xs">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const renderSection = (
  title: string,
  icon: string,
  categoryKey: string,
  processedMetrics: any,
) => {
  // Find the group with the matching category
  const group = processedMetrics.groups.find((g: any) => {
    const categoryMapping: Record<string, string> = {
      'Quality Metrics': 'quality',
      'Readability Analysis': 'readability',
      'Sentiment Analysis': 'sentiment',
      'Content Analysis': 'content',
      'Structure & Format': 'structure',
      'Keywords & Terms': 'keywords',
      Validation: 'validation',
      Performance: 'performance',
      'Technical Metrics': 'validation',
      'Custom Metrics': 'custom',
    };
    return g.category === categoryMapping[title];
  });

  if (!group || group.items.length === 0) return null;

  return (
    <div key={categoryKey} className="mb-4">
      <div className="mb-3 flex items-center space-x-2">
        <span className="text-sm">{icon}</span>
        <h4 className="text-foreground text-sm font-semibold">{title}</h4>
        {group.hasErrors && (
          <span className="text-xs text-red-500">⚠️ Contains errors</span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {group.items.map((item: any) =>
          renderMetric(
            item.name,
            item.value,
            item.unit,
            item.description || item.tooltip,
            item.colSpan === 2,
            item.isDisabled,
          ),
        )}
      </div>
    </div>
  );
};

/**
 * Results panel for the unified panel interface
 * Restored old evaluation panel with updated wiring for new metrics system
 */
const UnifiedPanelResults: React.FC<UnifiedPanelResultsProps> = ({
  metrics,
  compact = true,
  className = '',
}) => {
  if (
    !metrics ||
    (typeof metrics === 'object' && Object.keys(metrics).length === 0)
  ) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="text-muted-foreground mb-4">
          <svg
            className="mx-auto mb-4 h-12 w-12 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          No Results Yet
        </h3>
        <p className="text-muted-foreground">
          Run an evaluation to see metrics and analysis here
        </p>
      </div>
    );
  }

  // Use the centralized processor for consistent formatting and categorization
  const processedMetrics = processMetrics(metrics as Record<string, unknown>, {
    groupByCategory: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {renderSection('Quality Metrics', '🎯', 'quality', processedMetrics)}
      {renderSection(
        'Readability Analysis',
        '📖',
        'readability',
        processedMetrics,
      )}
      {renderSection('Sentiment Analysis', '💭', 'sentiment', processedMetrics)}
      {renderSection('Content Analysis', '📄', 'content', processedMetrics)}
      {renderSection('Structure & Format', '📋', 'structure', processedMetrics)}
      {renderSection('Keywords & Terms', '🔍', 'keywords', processedMetrics)}
      {renderSection('Performance', '⚡', 'performance', processedMetrics)}
      {renderSection('Validation', '✅', 'validation', processedMetrics)}
      {renderSection('Custom Metrics', '🔧', 'custom', processedMetrics)}

      {processedMetrics.groups.every(
        (group: any) => group.items.length === 0,
      ) && (
        <div className="text-muted-foreground py-4 text-center">
          <p className="text-sm">No metrics available</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedPanelResults;
