import React from 'react';
import { MetricItem } from './MetricItem.js';

export interface MetricData {
  name: string;
  value: string | number;
  unit?: string;
  description?: string;
  originalValue?: string | number;
  originalKey?: string;
}

export type MetricTuple = [
  name: string,
  value: string | number,
  unit?: string,
  description?: string,
  originalValue?: unknown,
  originalKey?: string,
];

interface MetricSectionProps {
  title: string;
  icon: React.ReactNode;
  metrics: MetricTuple[];
}

export const MetricSection: React.FC<MetricSectionProps> = ({
  title,
  icon,
  metrics,
}) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center space-x-2">
        <span className="text-sm">{icon}</span>
        <h4 className="text-foreground text-sm font-semibold">{title}</h4>
      </div>
      <div className="space-y-1">
        {metrics.map(
          (
            [
              name,
              value,
              unit,
              description,
              originalValue,
              originalKey,
            ]: MetricTuple,
            index: number,
          ) => (
            <MetricItem
              key={index}
              name={name}
              value={value}
              unit={unit}
              description={description}
              originalValue={originalValue}
              originalKey={originalKey}
              index={index}
            />
          ),
        )}
      </div>
    </div>
  );
};
