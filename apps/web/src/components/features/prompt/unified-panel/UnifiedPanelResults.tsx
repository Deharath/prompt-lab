/**
 * UnifiedPanelResults - Restored old evaluation panel with updated wiring
 * Brings back the beloved old panel design with modern metrics system integration
 */

import React, { useState, useRef, useEffect } from 'react';
import { type MetricResult } from '@prompt-lab/shared-types';

interface UnifiedPanelResultsProps {
  metrics: MetricResult | Record<string, unknown> | null | undefined;
  compact?: boolean;
  className?: string;
}

// Metric configuration moved outside for reusability
const metricConfig: Record<
  string,
  {
    category: string;
    displayName: string;
    shortName?: string;
    description: string;
  }
> = {
  f_score: {
    category: 'quality',
    displayName: 'Content F-Score',
    shortName: 'F-Score',
    description: 'Balanced measure of content precision and recall',
  },
  precision: {
    category: 'quality',
    displayName: 'Content Precision',
    shortName: 'Precision',
    description: 'How much of the output is relevant to the input',
  },
  recall: {
    category: 'quality',
    displayName: 'Content Recall',
    shortName: 'Recall',
    description: 'How much of the input is covered in the output',
  },
  vocab_diversity: {
    category: 'quality',
    displayName: 'Vocabulary Diversity',
    shortName: 'Vocab Diversity',
    description: 'Unique words vs total words ratio',
  },
  completeness_score: {
    category: 'quality',
    displayName: 'Content Completeness',
    shortName: 'Completeness',
    description: 'Response depth and structure quality',
  },
  flesch_reading_ease: {
    category: 'readability',
    displayName: 'Flesch Reading Ease',
    shortName: 'Reading Ease',
    description: 'Text readability (0-100, higher = easier)',
  },
  flesch_kincaid_grade: {
    category: 'readability',
    displayName: 'Flesch-Kincaid Grade',
    shortName: 'Grade Level',
    description: 'Reading grade level required',
  },
  smog_index: {
    category: 'readability',
    displayName: 'SMOG Index',
    description: 'Simple Measure of Gobbledygook',
  },
  sentiment: {
    category: 'sentiment',
    displayName: 'Sentiment',
    description: 'Overall sentiment analysis',
  },
  sentiment_detailed: {
    category: 'sentiment',
    displayName: 'Detailed Sentiment',
    description: 'Detailed sentiment distribution',
  },
  word_count: {
    category: 'content',
    displayName: 'Word Count',
    description: 'Number of words in output',
  },
  sentence_count: {
    category: 'content',
    displayName: 'Sentence Count',
    description: 'Number of sentences in output',
  },
  avg_words_per_sentence: {
    category: 'content',
    displayName: 'Avg Words/Sentence',
    shortName: 'Words/Sent',
    description: 'Average sentence length',
  },
  is_valid_json: {
    category: 'technical',
    displayName: 'Valid JSON',
    description: 'JSON validity check',
  },
  response_time_ms: {
    category: 'technical',
    displayName: 'Response Time',
    description: 'Processing latency',
  },
};

const processMetrics = (metrics: Record<string, unknown>) => {
  const categories: Record<string, any[]> = {
    quality: [],
    readability: [],
    sentiment: [],
    content: [],
    technical: [],
  };

  Object.entries(metrics).forEach(([key, value]) => {
    if (
      key.includes('_error') ||
      key.includes('start') ||
      key.includes('end') ||
      key.includes('totalTokens') ||
      key === 'latency'
    ) {
      return;
    }

    const config = metricConfig[key] || {
      category: 'technical',
      displayName: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      description: 'Custom metric',
    };

    let formattedValue: string | number = value as string | number;
    let unit = '';

    if (key === 'sentiment') {
      // Check if sentiment is disabled
      const isDisabled =
        typeof value === 'string' && value.toLowerCase().includes('disabled');

      if (isDisabled) {
        formattedValue = 'Disabled (Low Memory)';
        categories[config.category].push([
          config.displayName,
          formattedValue.toString(),
          '🚫',
          'Sentiment analysis disabled due to memory constraints',
          value,
          key,
          true, // isDisabled flag
        ]);
        return;
      }

      let sentimentObj: Record<string, unknown> | null = null;

      if (typeof value === 'object' && value !== null) {
        sentimentObj = value as Record<string, unknown>;
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            sentimentObj = parsed as Record<string, unknown>;
          }
        } catch {
          // If parsing fails, treat as plain string
        }
      }

      if (
        sentimentObj &&
        'label' in sentimentObj &&
        'confidence' in sentimentObj
      ) {
        const label = sentimentObj.label as string;
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else if (sentimentObj && 'compound' in sentimentObj) {
        const compound = sentimentObj.compound as number;
        const label =
          compound > 0.1
            ? 'positive'
            : compound < -0.1
              ? 'negative'
              : 'neutral';
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else if (
        sentimentObj &&
        'positive' in sentimentObj &&
        'negative' in sentimentObj &&
        'neutral' in sentimentObj
      ) {
        // Handle the new sentiment format from updated metrics system
        const positive = sentimentObj.positive as number;
        const negative = sentimentObj.negative as number;
        const neutral = sentimentObj.neutral as number;

        const scores = { positive, negative, neutral };
        const maxEntry = Object.entries(scores).reduce((max, [key, val]) =>
          val > max[1] ? [key, val] : max,
        );

        const label =
          maxEntry[0].charAt(0).toUpperCase() + maxEntry[0].slice(1);
        formattedValue = label; // Just the word for regular sentiment
      } else if (typeof value === 'number') {
        const label =
          value > 0.1 ? 'positive' : value < -0.1 ? 'negative' : 'neutral';
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else {
        formattedValue = typeof value === 'string' ? value : String(value);
      }
    } else if (key === 'sentiment_detailed') {
      // Check if sentiment is disabled
      const isDisabled =
        typeof value === 'string' && value.toLowerCase().includes('disabled');

      if (isDisabled) {
        formattedValue = 'Disabled (Low Memory)';
        categories[config.category].push([
          config.displayName,
          formattedValue.toString(),
          '🚫',
          'Detailed sentiment analysis disabled due to memory constraints',
          value,
          key,
          true, // isDisabled flag
        ]);
        return;
      }

      let sentimentObj: Record<string, unknown> | null = null;

      if (typeof value === 'object' && value !== null) {
        sentimentObj = value as Record<string, unknown>;
      } else if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (typeof parsed === 'object' && parsed !== null) {
            sentimentObj = parsed as Record<string, unknown>;
          }
        } catch {
          // If parsing fails, treat as plain string
        }
      }

      if (
        sentimentObj &&
        'positive' in sentimentObj &&
        'negative' in sentimentObj &&
        'neutral' in sentimentObj
      ) {
        const positive = sentimentObj.positive as number;
        const negative = sentimentObj.negative as number;
        const neutral = sentimentObj.neutral as number;

        // Show all three sentiments with percentages for detailed view
        formattedValue = `Positive: ${(positive * 100).toFixed(1)}%, Negative: ${(negative * 100).toFixed(1)}%, Neutral: ${(neutral * 100).toFixed(1)}%`;
      } else if (sentimentObj && 'compound' in sentimentObj) {
        const compound = sentimentObj.compound as number;
        const label =
          compound > 0.1
            ? 'positive'
            : compound < -0.1
              ? 'negative'
              : 'neutral';
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else {
        formattedValue =
          typeof value === 'string' ? value : JSON.stringify(value);
      }
    } else if (typeof value === 'number') {
      if (
        key.includes('score') ||
        key.includes('precision') ||
        key.includes('recall') ||
        key === 'f_score'
      ) {
        if (value >= 0 && value <= 1) {
          formattedValue = `${(value * 100).toFixed(1)}%`;
        } else {
          formattedValue = value.toFixed(3);
        }
      } else if (key.includes('flesch') || key === 'smog_index') {
        formattedValue = value.toFixed(1);
      } else if (key.includes('count')) {
        formattedValue = Math.round(value);
      } else if (key === 'response_time_ms') {
        formattedValue = `${value.toFixed(0)}ms`;
      } else {
        formattedValue = value.toFixed(2);
      }
    } else if (typeof value === 'object' && value !== null) {
      formattedValue = JSON.stringify(value);
    } else if (typeof value === 'boolean') {
      formattedValue = value ? 'Yes' : 'No';
      unit = value ? '✅' : '❌';
    } else {
      formattedValue = String(value);
    }

    categories[config.category].push([
      config.displayName,
      formattedValue.toString(),
      unit,
      config.description,
      value,
      key,
      false, // isDisabled flag
    ]);
  });

  return categories;
};

// Smart title display that adapts to available space
const SmartTitle = ({
  fullName,
  shortName,
  className = '',
}: {
  fullName: string;
  shortName?: string;
  className?: string;
}) => {
  return (
    <>
      {/* Show full name on larger screens */}
      <span className={`${className} hidden sm:block`}>{fullName}</span>
      {/* Show short name on smaller screens if available */}
      {shortName && (
        <span className={`${className} block sm:hidden`}>{shortName}</span>
      )}
      {/* Fallback to full name if no short name */}
      {!shortName && (
        <span className={`${className} block sm:hidden`}>{fullName}</span>
      )}
    </>
  );
};

// Smart content display for detailed sentiment
const SmartContent = ({
  content,
  isWide = false,
}: {
  content: string;
  isWide?: boolean;
}) => {
  // For detailed sentiment, split into lines on smaller screens
  if (
    content.includes('Positive:') &&
    content.includes('Negative:') &&
    content.includes('Neutral:')
  ) {
    const parts = content.split(', ');
    return (
      <div
        className={`${isWide ? 'sm:flex sm:flex-wrap sm:gap-2' : 'flex flex-col'}`}
      >
        {parts.map((part, index) => (
          <span
            key={index}
            className={`${isWide ? 'sm:inline' : 'block text-xs'} ${!isWide && index > 0 ? 'mt-1' : ''}`}
          >
            {part}
          </span>
        ))}
      </div>
    );
  }

  return (
    <span className={`${isWide ? 'whitespace-nowrap' : 'break-words'}`}>
      {content}
    </span>
  );
};

// Smart tooltip component that prevents overflow
const SmartTooltip = ({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'top',
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Calculate available space in each direction
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewport.width - triggerRect.right;

      let placement = 'top';
      let top = 0;
      let left = 0;

      // Determine best placement based on available space
      if (spaceTop >= tooltipRect.height + 8) {
        // Prefer top if there's enough space
        placement = 'top';
        top = triggerRect.top - tooltipRect.height - 8;
      } else if (spaceBottom >= tooltipRect.height + 8) {
        // Use bottom if not enough space at top
        placement = 'bottom';
        top = triggerRect.bottom + 8;
      } else if (spaceRight >= tooltipRect.width + 8) {
        // Use right if not enough vertical space
        placement = 'right';
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      } else if (spaceLeft >= tooltipRect.width + 8) {
        // Use left as last resort
        placement = 'left';
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
      } else {
        // Default to top with viewport clamping
        placement = 'top';
        top = Math.max(8, triggerRect.top - tooltipRect.height - 8);
      }

      // Calculate horizontal position
      if (placement === 'top' || placement === 'bottom') {
        // Center horizontally, but clamp to viewport
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        left = Math.max(
          8,
          Math.min(left, viewport.width - tooltipRect.width - 8),
        );
      } else if (placement === 'right') {
        left = triggerRect.right + 8;
      } else if (placement === 'left') {
        left = triggerRect.left - tooltipRect.width - 8;
      }

      // Clamp vertical position to viewport
      if (placement === 'right' || placement === 'left') {
        top = Math.max(
          8,
          Math.min(top, viewport.height - tooltipRect.height - 8),
        );
      }

      setPosition({ top, left, placement });
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div className="group relative">
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30 flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded-full border text-xs"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className="bg-popover/95 text-popover-foreground border-border pointer-events-none fixed z-50 rounded-md border px-3 py-2 text-xs shadow-lg backdrop-blur-sm transition-opacity duration-200"
          style={{
            top: position.top,
            left: position.left,
            maxWidth: '280px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
          }}
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div
              className={`absolute h-0 w-0 border-4 border-transparent ${
                position.placement === 'top'
                  ? 'border-t-popover top-full left-1/2 -translate-x-1/2 transform'
                  : position.placement === 'bottom'
                    ? 'border-b-popover bottom-full left-1/2 -translate-x-1/2 transform'
                    : position.placement === 'right'
                      ? 'border-r-popover top-1/2 right-full -translate-y-1/2 transform'
                      : 'border-l-popover top-1/2 left-full -translate-y-1/2 transform'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const renderMetric = (
  name: string,
  value: string,
  unit?: string,
  description?: string,
  isWide?: boolean,
  isDisabled?: boolean,
  shortName?: string,
) => (
  <div
    key={name}
    className={`bg-muted/20 border-border/50 flex min-h-[60px] flex-col rounded-md border p-3 ${
      isWide ? 'col-span-2' : ''
    } ${isDisabled ? 'opacity-60' : ''}`}
  >
    <div className="mb-2 flex items-start space-x-2">
      <div className="flex-1">
        <SmartTitle
          fullName={name}
          shortName={shortName}
          className="text-foreground/80 text-xs leading-tight font-medium"
        />
      </div>
      {description && <SmartTooltip content={description}>?</SmartTooltip>}
    </div>
    <div className="flex flex-1 items-center">
      <div
        className={`text-foreground text-sm leading-tight font-semibold ${isDisabled ? 'text-muted-foreground' : ''}`}
      >
        <SmartContent content={value} isWide={isWide} />
      </div>
      {unit && (
        <span className="text-muted-foreground ml-1 flex-shrink-0 text-xs">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const renderSection = (
  title: string,
  icon: string,
  categoryKey: string,
  categorizedMetrics: any,
) => {
  const categoryMetrics = categorizedMetrics[categoryKey];
  if (!categoryMetrics || categoryMetrics.length === 0) return null;

  return (
    <div key={categoryKey} className="mb-4">
      <div className="mb-3 flex items-center space-x-2">
        <span className="text-sm">{icon}</span>
        <h4 className="text-foreground text-sm font-semibold">{title}</h4>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categoryMetrics.map(
          ([name, value, unit, description, , key, isDisabled]: any[]) => {
            // Find the config for this metric to get shortName
            const config = Object.values(metricConfig).find(
              (c) => c.displayName === name,
            );
            const shortName = config?.shortName;

            return renderMetric(
              name,
              value,
              unit,
              description,
              name === 'Detailed Sentiment',
              isDisabled,
              shortName,
            );
          },
        )}
      </div>
    </div>
  );
};

/**
 * Results panel for the unified panel interface
 * Restored old evaluation panel with updated wiring for new metrics system
 */
const UnifiedPanelResults: React.FC<UnifiedPanelResultsProps> = ({
  metrics,
  compact = true, // Default to compact for unified panel
  className = '',
}) => {
  if (
    !metrics ||
    (typeof metrics === 'object' && Object.keys(metrics).length === 0)
  ) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="text-muted-foreground mb-4">
          <svg
            className="mx-auto mb-4 h-12 w-12 opacity-60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-foreground mb-2 text-lg font-semibold">
          No Results Yet
        </h3>
        <p className="text-muted-foreground">
          Run an evaluation to see metrics and analysis here
        </p>
      </div>
    );
  }

  const categorizedMetrics = processMetrics(metrics as Record<string, unknown>);

  return (
    <div className={`space-y-4 ${className}`}>
      {renderSection('Quality Metrics', '🎯', 'quality', categorizedMetrics)}
      {renderSection(
        'Readability Analysis',
        '📖',
        'readability',
        categorizedMetrics,
      )}
      {renderSection(
        'Sentiment Analysis',
        '💭',
        'sentiment',
        categorizedMetrics,
      )}
      {renderSection('Content Analysis', '📄', 'content', categorizedMetrics)}
      {renderSection(
        'Technical Metrics',
        '⚙️',
        'technical',
        categorizedMetrics,
      )}

      {Object.values(categorizedMetrics).every((cat) => cat.length === 0) && (
        <div className="text-muted-foreground py-4 text-center">
          <p className="text-sm">No metrics available</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedPanelResults;
