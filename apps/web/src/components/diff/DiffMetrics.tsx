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
  const metricStats = calculateMetricStats(baseJob, compareJob);

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
          <DiffMetricsTable
            metricStats={metricStats}
            baseJob={baseJob}
            compareJob={compareJob}
          />
        </div>
      </Card>
    </div>
  );
};
