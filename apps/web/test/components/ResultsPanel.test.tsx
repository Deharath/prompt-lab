import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultsPanel from '../../src/components/features/metrics/ResultsPanel.js';
import type { MetricResult } from '@prompt-lab/shared-types';

// Mock the child components
vi.mock('../../src/components/ui/Skeleton.js', () => ({
  ResultsPanelSkeleton: () => (
    <div data-testid="results-panel-skeleton">Loading...</div>
  ),
}));

vi.mock(
  '../../src/components/features/metrics/UnifiedMetricsDisplay.js',
  () => ({
    default: ({
      metrics,
      title,
      compact,
      showCategories,
      showTooltips,
      className,
      'data-testid': dataTestId,
    }: any) => (
      <div
        data-testid={dataTestId || 'unified-metrics-display'}
        className={className}
      >
        <div data-testid="metrics-title">{title}</div>
        <div data-testid="metrics-content">
          {Object.entries(metrics || {}).map(([key, value]: [string, any]) => (
            <div key={key} data-testid={`metric-${key}`}>
              <span data-testid="metric-key">{key}</span>
              <span data-testid="metric-value">
                {value?.display || value?.value || 'N/A'}
              </span>
            </div>
          ))}
        </div>
        {compact && <div data-testid="compact-indicator">Compact Mode</div>}
        {showCategories && (
          <div data-testid="categories-indicator">Categories Shown</div>
        )}
        {showTooltips && (
          <div data-testid="tooltips-indicator">Tooltips Enabled</div>
        )}
      </div>
    ),
  }),
);

describe('ResultsPanel', () => {
  const mockMetrics: MetricResult = {
    word_count: 150,
    sentiment: { label: 'positive', score: 0.8, confidence: 0.9 },
    keywords: {
      found: ['test', 'example'],
      missing: [],
      foundCount: 2,
      missingCount: 0,
      matchPercentage: 100,
      totalMatches: 2,
    },
  };

  const defaultProps = {
    metrics: mockMetrics,
    jobId: 'test-job-123',
    title: 'Test Results',
    showInsights: true,
    compact: false,
    className: 'test-class',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<ResultsPanel metrics={mockMetrics} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-title')).toHaveTextContent(
        'Evaluation Results',
      );
    });

    it('should render with custom title', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('metrics-title')).toHaveTextContent(
        'Test Results',
      );
    });

    it('should apply custom className', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('results-panel')).toHaveClass('test-class');
    });

    it('should render metrics content', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('metrics-content')).toBeInTheDocument();
      expect(screen.getByTestId('metric-word_count')).toBeInTheDocument();
      expect(screen.getByTestId('metric-sentiment')).toBeInTheDocument();
      expect(screen.getByTestId('metric-keywords')).toBeInTheDocument();
    });

    it('should pass correct props to UnifiedMetricsDisplay', () => {
      render(<ResultsPanel {...defaultProps} />);

      // Check that categories and tooltips are enabled by default
      expect(screen.getByTestId('categories-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('tooltips-indicator')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show skeleton when metrics is undefined', () => {
      render(<ResultsPanel metrics={undefined} />);

      expect(screen.getByTestId('results-panel-skeleton')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-metrics-display'),
      ).not.toBeInTheDocument();
    });

    it('should show skeleton when metrics is empty object', () => {
      render(<ResultsPanel metrics={{}} />);

      expect(screen.getByTestId('results-panel-skeleton')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-metrics-display'),
      ).not.toBeInTheDocument();
    });

    it('should show skeleton when metrics is null', () => {
      render(<ResultsPanel metrics={null as any} />);

      expect(screen.getByTestId('results-panel-skeleton')).toBeInTheDocument();
      expect(
        screen.queryByTestId('unified-metrics-display'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should pass compact prop to UnifiedMetricsDisplay', () => {
      render(<ResultsPanel {...defaultProps} compact />);

      expect(screen.getByTestId('compact-indicator')).toBeInTheDocument();
    });

    it('should not show compact indicator when compact is false', () => {
      render(<ResultsPanel {...defaultProps} compact={false} />);

      expect(screen.queryByTestId('compact-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Metric Display', () => {
    it('should display correct metric values', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('metric-word_count')).toBeInTheDocument();
      expect(screen.getByTestId('metric-sentiment')).toBeInTheDocument();
      expect(screen.getByTestId('metric-keywords')).toBeInTheDocument();
    });

    it('should handle different metric value types', () => {
      const mixedMetrics = {
        number_metric: { value: 42, display: '42' },
        string_metric: { value: 'test', display: 'test' },
        boolean_metric: { value: true, display: 'Yes' },
        array_metric: { value: [1, 2, 3], display: '1, 2, 3' },
      };

      render(<ResultsPanel metrics={mixedMetrics} />);

      expect(screen.getByTestId('metric-number_metric')).toBeInTheDocument();
      expect(screen.getByTestId('metric-string_metric')).toBeInTheDocument();
      expect(screen.getByTestId('metric-boolean_metric')).toBeInTheDocument();
      expect(screen.getByTestId('metric-array_metric')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single metric', () => {
      const singleMetric = {
        word_count: { value: 100, display: '100 words' },
      };

      render(<ResultsPanel metrics={singleMetric} />);

      expect(screen.getByTestId('metric-word_count')).toBeInTheDocument();
      expect(screen.queryByTestId('metric-sentiment')).not.toBeInTheDocument();
    });

    it('should handle metrics with missing display values', () => {
      const incompleteMetrics = {
        test_metric: { value: 'test' }, // Missing display property
      };

      render(<ResultsPanel metrics={incompleteMetrics} />);

      expect(screen.getByTestId('metric-test_metric')).toBeInTheDocument();
    });

    it('should handle metrics with null values', () => {
      const nullMetrics = {
        null_metric: { value: null, display: 'N/A' },
      };

      render(<ResultsPanel metrics={nullMetrics} />);

      expect(screen.getByTestId('metric-null_metric')).toBeInTheDocument();
    });
  });

  describe('Optional Props', () => {
    it('should work with minimal props', () => {
      render(<ResultsPanel metrics={mockMetrics} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-title')).toHaveTextContent(
        'Evaluation Results',
      );
    });

    it('should handle undefined jobId', () => {
      render(<ResultsPanel metrics={mockMetrics} jobId={undefined} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
    });

    it('should handle undefined showInsights', () => {
      render(<ResultsPanel metrics={mockMetrics} showInsights={undefined} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass through className to UnifiedMetricsDisplay', () => {
      render(<ResultsPanel {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('results-panel')).toHaveClass('custom-class');
    });

    it('should pass data-testid to UnifiedMetricsDisplay', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
    });

    it('should enable categories and tooltips by default', () => {
      render(<ResultsPanel {...defaultProps} />);

      expect(screen.getByTestId('categories-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('tooltips-indicator')).toBeInTheDocument();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain the same API as legacy ResultsPanel', () => {
      // Test that all props are still supported
      const legacyProps = {
        metrics: mockMetrics,
        jobId: 'legacy-job',
        title: 'Legacy Results',
        showInsights: true,
        compact: false,
        className: 'legacy-class',
      };

      render(<ResultsPanel {...legacyProps} />);

      expect(screen.getByTestId('results-panel')).toBeInTheDocument();
      expect(screen.getByTestId('metrics-title')).toHaveTextContent(
        'Legacy Results',
      );
      expect(screen.getByTestId('results-panel')).toHaveClass('legacy-class');
    });
  });
});
