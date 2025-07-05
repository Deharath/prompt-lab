import React from 'react';
import { MetricItem } from './MetricItem';

export const MetricSection = ({ title, icon, metrics }) => {
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
            [name, value, unit, description, originalValue, originalKey],
            index,
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
