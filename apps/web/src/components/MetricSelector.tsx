import { useState } from 'react';
import Card from './ui/Card.js';
import Tooltip from './ui/Tooltip.js';

/**
 * Interface defining a metric option that can be selected by users
 */
export interface MetricOption {
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

/**
 * Interface for selected metric data including any user inputs
 */
export interface SelectedMetric {
  id: string;
  input?: string;
}

interface MetricSelectorProps {
  metrics: MetricOption[];
  selectedMetrics: SelectedMetric[];
  onChange: (metrics: SelectedMetric[]) => void;
}

/**
 * MetricSelector component allows users to select which metrics to run
 * for evaluating responses, with optional input fields for metrics that
 * require additional configuration.
 */
const MetricSelector = ({
  metrics,
  selectedMetrics,
  onChange,
}: MetricSelectorProps) => {
  const [userInputs, setUserInputs] = useState<Record<string, string>>({});

  // Check if a metric is currently selected
  const isSelected = (id: string) => {
    return selectedMetrics.some((m) => m.id === id);
  };

  // Handle checkbox toggle
  const handleToggleMetric = (metric: MetricOption) => {
    const isCurrentlySelected = isSelected(metric.id);

    let newSelectedMetrics: SelectedMetric[];

    if (isCurrentlySelected) {
      // Remove the metric if it's already selected
      newSelectedMetrics = selectedMetrics.filter((m) => m.id !== metric.id);
    } else {
      // Add the metric
      const newMetric: SelectedMetric = {
        id: metric.id,
      };

      // Add any input if the metric requires it
      if (metric.requiresInput && userInputs[metric.id]) {
        newMetric.input = userInputs[metric.id];
      }

      newSelectedMetrics = [...selectedMetrics, newMetric];
    }

    onChange(newSelectedMetrics);
  };

  // Handle input change for metrics that require additional data
  const handleInputChange = (metricId: string, value: string) => {
    // Update local state with the input
    setUserInputs((prev) => ({
      ...prev,
      [metricId]: value,
    }));

    // Update the selected metrics if this metric is already selected
    if (isSelected(metricId)) {
      const newSelectedMetrics = selectedMetrics.map((m) => {
        if (m.id === metricId) {
          return {
            ...m,
            input: value,
          };
        }
        return m;
      });

      onChange(newSelectedMetrics);
    }
  };

  return (
    <Card title="Evaluation Metrics">
      <div className="space-y-3">
        {metrics.map((metric) => {
          const isChecked = isSelected(metric.id);
          return (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`metric-${metric.id}`}
                  checked={isChecked}
                  onChange={() => handleToggleMetric(metric)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor={`metric-${metric.id}`}
                  className="text-sm font-medium"
                >
                  {metric.name}
                </label>
                <Tooltip content={metric.description}>
                  <span
                    className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
                    aria-hidden="true"
                  >
                    ?
                  </span>
                </Tooltip>
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
                  <input
                    type="text"
                    id={`metric-input-${metric.id}`}
                    data-testid={
                      metric.id === 'keywords' ? 'keyword-input' : undefined
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder={metric.inputPlaceholder || ''}
                    value={userInputs[metric.id] || ''}
                    onChange={(e) =>
                      handleInputChange(metric.id, e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}

        {metrics.length === 0 && (
          <p className="text-sm text-muted">No metrics available</p>
        )}
      </div>
    </Card>
  );
};

export default MetricSelector;
