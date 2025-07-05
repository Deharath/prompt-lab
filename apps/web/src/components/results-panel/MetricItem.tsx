import React from 'react';

const getScoreColor = (_value: unknown, _key: string): string => {
  return 'text-foreground';
};

interface MetricItemProps {
  name: string;
  value: any;
  unit?: string;
  description?: string;
  originalValue?: any;
  originalKey?: string;
  index?: number;
}

export const MetricItem: React.FC<MetricItemProps> = ({
  name,
  value,
  unit,
  description,
  originalValue,
  originalKey,
  index,
}) => (
  <div
    key={`${name}-${index || 0}`}
    className="bg-muted/20 dark:bg-muted/10 border-border/50 flex items-center justify-between rounded-md border px-3 py-2"
    title={description}
  >
    <div className="flex items-center space-x-2">
      <span className="text-foreground/80 text-xs font-medium">{name}</span>
      {description && (
        <div className="group relative">
          <span className="text-muted-foreground h-3 w-3 cursor-help text-xs">
            ℹ️
          </span>
          <div className="bg-popover text-popover-foreground border-border pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 transform rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
            {description}
          </div>
        </div>
      )}
    </div>
    <div className="flex items-center space-x-1">
      <span
        className={`text-xs font-semibold ${getScoreColor(
          originalValue || value,
          originalKey || name.toLowerCase(),
        )}`}
      >
        {value}
      </span>
      {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
    </div>
  </div>
);
