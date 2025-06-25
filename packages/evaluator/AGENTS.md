# Evaluator Package Notes

## How to add a metric

1. Create a file in `src/metrics` exporting a default object that implements the `Metric` interface.
2. The object must have an async `evaluate({ prediction, references })` method returning `{ score: number, explanation?: string }`.
3. Metrics are discovered automatically by `discoverMetrics()` and can be run via `runMetric(name, args)`.
