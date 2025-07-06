import React from 'react';
import Card from '../ui/Card.js';
import StatCard from '../ui/StatCard.js';
import { calculateMetricStats } from './metrics-calculator.js';
import { DiffMetricsTable } from './DiffMetricsTable.js';

interface DiffMetricsProps {
  baseJob: any; // TODO: Add proper Job type
  compareJob: any; // TODO: Add proper Job type
}

export const DiffMetrics: React.FC<DiffMetricsProps> = ({
  baseJob,
  compareJob,
}) => {
  // Add error handling for missing job data
  if (!baseJob || !compareJob) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-foreground mb-1 text-sm font-medium">
            Missing Job Data
          </h3>
          <p className="text-muted-foreground text-xs">
            Unable to load job comparison data
          </p>
        </div>
      </div>
    );
  }

  let metricStats;
  try {
    metricStats = calculateMetricStats(baseJob, compareJob);
  } catch (error) {
    console.error('Error calculating metric stats:', error);
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-foreground mb-1 text-sm font-medium">
            Metrics Calculation Error
          </h3>
          <p className="text-muted-foreground text-xs">
            Unable to calculate metrics comparison
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="metrics-panel" role="tabpanel" aria-labelledby="metrics-tab">
      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        role="region"
        aria-label="Metrics comparison overview"
      >
        {metricStats.slice(0, 4).map((stat: any) => (
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

      <Card title="Detailed Metrics Comparison">
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Detailed metrics comparison table"
        >
          {metricStats.length > 0 ? (
            <DiffMetricsTable
              metricStats={metricStats}
              baseJob={baseJob}
              compareJob={compareJob}
            />
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <h3 className="text-foreground mb-1 text-sm font-medium">
                  No Metrics Available
                </h3>
                <p className="text-muted-foreground text-xs">
                  These jobs don't have comparable metrics data
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
