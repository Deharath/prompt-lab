// Metric types extracted from obsolete MetricSelector component

export interface MetricOption {
  id: string;
  name: string;
  description: string;
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
}

export interface SelectedMetric {
  id: string;
  input?: string;
}
