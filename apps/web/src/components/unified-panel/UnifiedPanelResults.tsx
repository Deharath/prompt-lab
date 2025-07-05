import React from 'react';

const processMetrics = (metrics: Record<string, unknown>) => {
  const categories: Record<
    string,
    Array<[string, string, string?, string?, unknown?, string?]>
  > = {
    quality: [],
    readability: [],
    sentiment: [],
    content: [],
    technical: [],
  };

  const metricConfig: Record<
    string,
    {
      category: string;
      displayName: string;
      description: string;
    }
  > = {
    f_score: {
      category: 'quality',
      displayName: 'Content F-Score',
      description: 'Balanced measure of content precision and recall',
    },
    precision: {
      category: 'quality',
      displayName: 'Content Precision',
      description: 'How much of the output is relevant to the input',
    },
    recall: {
      category: 'quality',
      displayName: 'Content Recall',
      description: 'How much of the input is covered in the output',
    },
    vocab_diversity: {
      category: 'quality',
      displayName: 'Vocabulary Diversity',
      description: 'Unique words vs total words ratio',
    },
    completeness_score: {
      category: 'quality',
      displayName: 'Content Completeness',
      description: 'Response depth and structure quality',
    },
    flesch_reading_ease: {
      category: 'readability',
      displayName: 'Flesch Reading Ease',
      description: 'Text readability (0-100, higher = easier)',
    },
    flesch_kincaid: {
      category: 'readability',
      displayName: 'Flesch-Kincaid Grade',
      description: 'Reading grade level required',
    },
    smog: {
      category: 'readability',
      displayName: 'SMOG Index',
      description: 'Simple Measure of Gobbledygook',
    },
    sentiment: {
      category: 'sentiment',
      displayName: 'Sentiment Score',
      description: 'Overall sentiment analysis',
    },
    sentiment_detailed: {
      category: 'sentiment',
      displayName: 'Sentiment Breakdown',
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
        const confidence = sentimentObj.confidence as number;
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(
          1,
        )} ${(confidence * 100).toFixed(1)}%`;
      } else if (sentimentObj && 'compound' in sentimentObj) {
        const compound = sentimentObj.compound as number;
        const label =
          compound > 0.1
            ? 'positive'
            : compound < -0.1
              ? 'negative'
              : 'neutral';
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else if (typeof value === 'number') {
        const label =
          value > 0.1 ? 'positive' : value < -0.1 ? 'negative' : 'neutral';
        formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
      } else {
        formattedValue = typeof value === 'string' ? value : String(value);
      }
    } else if (key === 'sentiment_detailed') {
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

        formattedValue = `Positive: ${(positive * 100).toFixed(
          0,
        )}%, Negative: ${(negative * 100).toFixed(0)}%, Neutral: ${(
          neutral * 100
        ).toFixed(0)}%`;
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
      } else if (key.includes('flesch') || key === 'smog') {
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
    ]);
  });

  return categories;
};

const renderMetric = (
  name: string,
  value: string,
  unit?: string,
  description?: string,
  isWide?: boolean,
) => (
  <div
    key={name}
    className={`bg-muted/20 border-border/50 flex min-h-[60px] flex-col rounded-md border p-3 ${
      isWide ? 'col-span-2' : ''
    }`}
  >
    <div className="mb-1 flex items-center space-x-1">
      <span className="text-foreground/80 line-clamp-1 flex-1 text-xs font-medium">
        {name}
      </span>
      {description && (
        <div className="group relative">
          <div className="bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30 flex h-4 w-4 flex-shrink-0 cursor-help items-center justify-center rounded-full border text-xs">
            ?
          </div>
          <div className="bg-popover text-popover-foreground border-border pointer-events-none absolute right-0 bottom-full z-50 mb-1 rounded-md border px-2 py-1 text-xs whitespace-nowrap opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
            {description}
          </div>
        </div>
      )}
    </div>
    <div className="flex flex-1 items-center">
      <span
        className={`text-foreground text-sm leading-tight font-semibold ${
          isWide ? 'whitespace-nowrap' : 'break-words'
        }`}
      >
        {value}
      </span>
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
        {categoryMetrics.map(([name, value, unit, description]: any[]) =>
          renderMetric(
            name,
            value,
            unit,
            description,
            name === 'Sentiment Breakdown',
          ),
        )}
      </div>
    </div>
  );
};

interface UnifiedPanelResultsProps {
  metrics: Record<string, unknown> | undefined;
  hasResults: boolean;
}

export const UnifiedPanelResults = ({
  metrics,
  hasResults,
}: UnifiedPanelResultsProps) => {
  if (!hasResults || !metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="py-8 text-center">
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

  const categorizedMetrics = processMetrics(metrics);

  return (
    <div className="space-y-4">
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
