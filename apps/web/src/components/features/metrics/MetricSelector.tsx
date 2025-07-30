import React, { useState, useCallback, memo } from 'react';
import Card from '../../ui/Card.js';
import DebouncedInput from './DebouncedInput.js';
import type { MetricInput, MetricOption } from '@prompt-lab/shared-types';

interface MetricSelectorProps {
  metrics: MetricOption[];
  disabledMetrics?: string[];
  onChange: (disabledMetrics: string[]) => void;
  compact?: boolean;
}

/**
 * MetricSelector component allows users to disable specific metrics from
 * the comprehensive evaluation. By default, all available metrics are enabled,
 * and users can selectively disable metrics they don't need.
 */
const MetricSelector = memo<MetricSelectorProps>(
  ({
    metrics,
    disabledMetrics,
    onChange,
    compact = false,
  }: MetricSelectorProps) => {
    const [userInputs, setUserInputs] = useState<Record<string, string>>({});

    // Check if a metric is currently disabled
    const isDisabled = (id: string) => {
      return disabledMetrics?.includes(id) ?? false;
    };

    // Handle checkbox toggle
    const handleToggleMetric = (metric: MetricOption) => {
      const isCurrentlyDisabled = isDisabled(metric.id);
      const currentDisabled = disabledMetrics ?? [];

      let newDisabledMetrics: string[];

      if (isCurrentlyDisabled) {
        // Enable the metric by removing it from disabled list
        newDisabledMetrics = currentDisabled.filter((id) => id !== metric.id);
      } else {
        // Disable the metric by adding it to disabled list
        newDisabledMetrics = [...currentDisabled, metric.id];
      }

      onChange(newDisabledMetrics);
    };

    // Handle input change for metrics that require additional data (debounced)
    const handleInputChange = useCallback((metricId: string, value: string) => {
      // Update local state with the input
      setUserInputs((prev) => ({
        ...prev,
        [metricId]: value,
      }));

      // Note: Input handling is now simplified since we only need to store
      // the input value locally. The actual metric input will be handled
      // by the parent component or service layer when creating jobs.
    }, []);

    // Enhanced tooltip component for mobile and desktop
    const MetricTooltip = ({
      content,
      children,
    }: {
      content: string;
      children: React.ReactNode;
    }) => {
      const [isVisible, setIsVisible] = useState(false);

      return (
        <div className="relative inline-block">
          <div
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
            role="button"
            tabIndex={0}
            aria-label={content}
            className="cursor-pointer"
          >
            {children}
          </div>

          {isVisible && (
            <div
              className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[200px] -translate-x-1/2 transform rounded bg-gray-900 px-3 py-1.5 text-left text-xs text-white shadow-lg"
              role="tooltip"
            >
              <div className="break-words">{content}</div>
              <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 transform border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </div>
      );
    };

    return (
      <>
        {!compact ? (
          <Card title="Evaluation Metrics">
            <div className="space-y-3">
              {metrics.map((metric) => {
                const isChecked = !isDisabled(metric.id);
                return (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`metric-${metric.id}`}
                        checked={isChecked}
                        onChange={() => handleToggleMetric(metric)}
                        className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                      />
                      <label
                        htmlFor={`metric-${metric.id}`}
                        className="flex-1 text-sm font-medium"
                      >
                        {metric.name}
                      </label>
                      <MetricTooltip content={metric.description}>
                        <svg
                          className="text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer transition-colors"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </MetricTooltip>
                    </div>

                    {/* Input field for metrics that require additional input */}
                    {metric.requiresInput && isChecked && (
                      <div className="ml-6">
                        <label
                          htmlFor={`metric-input-${metric.id}`}
                          className="sr-only"
                        >
                          {metric.inputLabel || 'Input'}
                        </label>
                        <DebouncedInput
                          id={`metric-input-${metric.id}`}
                          data-testid={
                            metric.id === 'keywords'
                              ? 'keyword-input'
                              : undefined
                          }
                          className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
                          placeholder={metric.inputPlaceholder || ''}
                          value={userInputs[metric.id] || ''}
                          onChange={(value) =>
                            handleInputChange(metric.id, value)
                          }
                          delay={500}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {metrics.length === 0 && (
                <p className="text-muted text-sm">No metrics available</p>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {metrics.map((metric) => {
              const isChecked = !isDisabled(metric.id);
              return (
                <div key={metric.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`metric-${metric.id}`}
                      checked={isChecked}
                      onChange={() => handleToggleMetric(metric)}
                      className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                    />
                    <label
                      htmlFor={`metric-${metric.id}`}
                      className="flex-1 text-sm font-medium"
                    >
                      {metric.name}
                    </label>
                    <MetricTooltip content={metric.description}>
                      <svg
                        className="text-muted-foreground hover:text-foreground h-3.5 w-3.5 cursor-pointer transition-colors"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </MetricTooltip>
                  </div>

                  {/* Input field for metrics that require additional input */}
                  {metric.requiresInput && isChecked && (
                    <div className="ml-4">
                      <DebouncedInput
                        id={`metric-input-${metric.id}`}
                        data-testid={
                          metric.id === 'keywords' ? 'keyword-input' : undefined
                        }
                        className="border-border focus:border-primary focus:ring-primary bg-background block w-full rounded border px-3 py-1.5 text-sm shadow-sm focus:ring-1"
                        placeholder={metric.inputPlaceholder || ''}
                        value={userInputs[metric.id] || ''}
                        onChange={(value) =>
                          handleInputChange(metric.id, value)
                        }
                        delay={500}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {metrics.length === 0 && (
              <p className="text-muted-foreground text-xs">
                No metrics available
              </p>
            )}
          </div>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for React.memo optimization
    const prevDisabled = prevProps.disabledMetrics ?? [];
    const nextDisabled = nextProps.disabledMetrics ?? [];

    return (
      prevProps.compact === nextProps.compact &&
      prevProps.metrics === nextProps.metrics &&
      prevDisabled.length === nextDisabled.length &&
      prevDisabled.every((metricId, index) => metricId === nextDisabled[index])
    );
  },
);

export default MetricSelector;
