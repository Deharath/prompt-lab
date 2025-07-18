import React, { memo } from 'react';

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
  isDisabled?: boolean;
}

export const MetricItem = memo<MetricItemProps>(
  ({
    name,
    value,
    unit,
    description,
    originalValue,
    originalKey,
    index,
    isDisabled,
  }) => (
    <div
      key={`${name}-${index || 0}`}
      className={`border-border/50 flex items-center justify-between rounded-md border px-3 py-2 ${
        isDisabled
          ? 'bg-muted/10 dark:bg-muted/5 opacity-75'
          : 'bg-muted/20 dark:bg-muted/10'
      }`}
      title={description}
    >
      <div className="flex items-center space-x-2">
        <span
          className={`text-xs font-medium ${
            isDisabled ? 'text-muted-foreground' : 'text-foreground/80'
          }`}
        >
          {name}
        </span>
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
          className={`text-xs font-semibold ${
            isDisabled
              ? 'text-muted-foreground italic'
              : getScoreColor(
                  originalValue || value,
                  originalKey || name.toLowerCase(),
                )
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-muted-foreground text-xs">{unit}</span>}
      </div>
    </div>
  ),
);
