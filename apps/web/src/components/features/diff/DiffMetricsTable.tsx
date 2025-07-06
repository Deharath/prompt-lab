import React from 'react';
import type { JobDetails } from '../../../api.js';

export interface MetricStat {
  key: string;
  label: string;
  baseValue?: number;
  compareValue?: number;
  delta?: number;
  percentChange?: number;
  rawDelta?: number;
  isImprovement?: boolean;
}

const format = (val: number | null | undefined) =>
  val === undefined || val === null ? 'N/A' : val.toFixed(3);

const isImprovement = (key: string, delta: number) => {
  const lower = key.toLowerCase();
  if (
    lower.includes('cost') ||
    lower.includes('token') ||
    lower.includes('latency')
  ) {
    return delta <= 0;
  }
  return delta >= 0;
};

interface DiffMetricsTableProps {
  metricStats: MetricStat[];
  baseJob: JobDetails;
  compareJob: JobDetails;
}

export const DiffMetricsTable: React.FC<DiffMetricsTableProps> = ({
  metricStats,
  baseJob,
  compareJob,
}) => (
  <table className="w-full" role="table" aria-label="Detailed metrics data">
    <thead className="bg-muted/30 border-border border-b">
      <tr>
        <th
          className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase"
          scope="col"
        >
          Metric
        </th>
        <th
          className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase"
          scope="col"
        >
          Base
        </th>
        <th
          className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase"
          scope="col"
        >
          Compare
        </th>
        <th
          className="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wider uppercase"
          scope="col"
        >
          Delta
        </th>
      </tr>
    </thead>
    <tbody className="divide-border divide-y">
      {metricStats.map((stat: MetricStat) => (
        <tr key={stat.key} className="hover:bg-muted/20">
          <td
            className="text-foreground px-4 py-3 text-sm font-medium"
            scope="row"
          >
            {stat.label}
          </td>
          <td className="text-muted-foreground px-4 py-3 text-sm">
            {format(stat.baseValue)}
          </td>
          <td className="text-muted-foreground px-4 py-3 text-sm">
            {format(stat.compareValue)}
          </td>
          <td
            className={`px-4 py-3 text-sm font-medium ${
              stat.isImprovement ? 'text-success' : 'text-error'
            }`}
          >
            {stat.rawDelta !== undefined && stat.rawDelta > 0 ? '+' : ''}
            {format(stat.rawDelta)}
          </td>
        </tr>
      ))}
      <tr className="hover:bg-muted/20">
        <td
          className="text-foreground px-4 py-3 text-sm font-medium"
          scope="row"
        >
          Cost (USD)
        </td>
        <td className="text-muted-foreground px-4 py-3 text-sm">
          {format(baseJob.costUsd)}
        </td>
        <td className="text-muted-foreground px-4 py-3 text-sm">
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
          {(compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0) > 0 ? '+' : ''}
          {format((compareJob.costUsd ?? 0) - (baseJob.costUsd ?? 0))}
        </td>
      </tr>
      <tr className="hover:bg-muted/20">
        <td
          className="text-foreground px-4 py-3 text-sm font-medium"
          scope="row"
        >
          Tokens Used
        </td>
        <td className="text-muted-foreground px-4 py-3 text-sm">
          {baseJob.tokensUsed ?? 'N/A'}
        </td>
        <td className="text-muted-foreground px-4 py-3 text-sm">
          {compareJob.tokensUsed ?? 'N/A'}
        </td>
        <td
          className={`px-4 py-3 text-sm font-medium ${
            isImprovement(
              'token',
              (compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0),
            )
              ? 'text-success'
              : 'text-error'
          }`}
        >
          {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0) > 0
            ? '+'
            : ''}
          {(compareJob.tokensUsed ?? 0) - (baseJob.tokensUsed ?? 0)}
        </td>
      </tr>
    </tbody>
  </table>
);
