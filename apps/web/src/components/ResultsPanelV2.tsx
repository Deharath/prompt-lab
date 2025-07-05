import { useState, useEffect } from 'react';

// Removed unused interfaces: KeywordMetrics, JsonValidityMetrics, SentimentDetailedMetrics

interface ResultsPanelProps {
  metrics: Record<string, unknown> | undefined;
  jobId?: string;
  title?: string;
  showInsights?: boolean;
}

const ResultsPanel = ({
  metrics,
  jobId: _jobId,
  title = 'Evaluation Results',
  showInsights: _showInsights,
}: ResultsPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('evaluation-panel-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem(
      'evaluation-panel-collapsed',
      JSON.stringify(isCollapsed),
    );
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  // NEW metrics system processing aligned with plan_for_metrics_upgrade.md
  const processMetrics = (metrics: Record<string, unknown>) => {
    const categories: Record<
      string,
      Array<[string, string, string?, string?, unknown?, string?]> // Added originalKey as 6th element
    > = {
      quality: [],
      readability: [],
      sentiment: [],
      content: [],
      technical: [],
    };

    const metricConfig: Record<
      string,
      { category: string; displayName: string; description: string }
    > = {
      // NEW Quality Metrics (Task 7 focus) - content comparison metrics
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
      // Legacy keyword metrics (from keywords metric with individual results)
      keyword_precision: {
        category: 'quality',
        displayName: 'Legacy Keyword Precision',
        description: 'From keywords metric breakdown',
      },
      keyword_recall: {
        category: 'quality',
        displayName: 'Legacy Keyword Recall',
        description: 'From keywords metric breakdown',
      },
      keyword_f_score: {
        category: 'quality',
        displayName: 'Legacy Keyword F-Score',
        description: 'From keywords metric breakdown',
      },
      bert_score: {
        category: 'quality',
        displayName: 'BERT Score',
        description: 'Semantic similarity (Task 5 - optional microservice)',
      },

      // NEW Readability Service (Task 2)
      flesch_reading_ease: {
        category: 'readability',
        displayName: 'Flesch Reading Ease',
        description:
          'Text readability via text-readability-ts (0-100, higher = easier)',
      },
      flesch_kincaid: {
        category: 'readability',
        displayName: 'Flesch-Kincaid Grade',
        description: 'Reading grade level required (FRE/FK via Task 2)',
      },
      smog: {
        category: 'readability',
        displayName: 'SMOG Index',
        description: 'Simple Measure of Gobbledygook (Task 2 implementation)',
      },
      text_complexity: {
        category: 'readability',
        displayName: 'Text Complexity',
        description:
          'Overall complexity score based on vocabulary and structure',
      },

      // NEW Sentiment Service (Task 3)
      sentiment: {
        category: 'sentiment',
        displayName: 'Sentiment Score',
        description:
          'Xenova Twitter RoBERTa (accurate) or VADER (fast) based on SENTIMENT_MODE env',
      },
      sentiment_detailed: {
        category: 'sentiment',
        displayName: 'Detailed Sentiment',
        description:
          'Full sentiment breakdown with positive/negative/neutral confidence scores',
      },

      // NEW Content Metrics via Text Worker (Task 1)
      word_count: {
        category: 'content',
        displayName: 'Word Count',
        description: 'Word count via wink-tokenizer wrapper',
      },
      sentence_count: {
        category: 'content',
        displayName: 'Sentence Count',
        description: 'Sentence count from text analysis',
      },
      avg_words_per_sentence: {
        category: 'content',
        displayName: 'Avg Words/Sentence',
        description: 'Average sentence length metric',
      },
      keywords: {
        category: 'content',
        displayName: 'Keywords',
        description: 'Keyword matching with optional weighting (Task 4)',
      },

      // Technical Metrics (filtered as per plan)
      is_valid_json: {
        category: 'technical',
        displayName: 'Valid JSON',
        description: 'JSON validity check for structured output',
      },
      response_time_ms: {
        category: 'technical',
        displayName: 'Response Time',
        description: 'Latency tracking (Task 6 - basic logging)',
      },
      estimated_cost_usd: {
        category: 'technical',
        displayName: 'Estimated Cost',
        description: 'Cost tracking for budgeting purposes',
      },
    };

    Object.entries(metrics).forEach(([key, value]) => {
      // Skip obsolete metrics as per plan (remove old heuristic helpers)
      if (
        key.includes('_error') ||
        key.includes('start') ||
        key.includes('end') ||
        key.includes('totalTokens') ||
        key.includes('avgCosSim') ||
        key.includes('meanLatencyMs') ||
        key.includes('evaluationCases') ||
        key.includes('avgScore') ||
        key === 'latency' // Replace with response_time_ms
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
      const { category, displayName, description } = config;

      // NEW formatting for upgraded metrics system
      let formattedValue: string | number = value as string | number;
      let unit = '';

      // Handle sentiment specially regardless of type
      if (key === 'sentiment') {
        // Task 3: Enhanced Sentiment Service formatting for CardiffNLP
        // Handle both object and stringified object cases
        let sentimentObj: Record<string, unknown> | null = null;

        if (typeof value === 'object' && value !== null) {
          sentimentObj = value as Record<string, unknown>;
        } else if (typeof value === 'string') {
          // Try to parse if it's a stringified JSON object
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
          formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)} (${(confidence * 100).toFixed(1)}%)`;
          unit = ''; // Remove emoji icons as requested
        } else if (sentimentObj && 'compound' in sentimentObj) {
          const compound = sentimentObj.compound as number;
          const label =
            compound > 0.1
              ? 'positive'
              : compound < -0.1
                ? 'negative'
                : 'neutral';
          formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
          unit = ''; // Remove emoji icons as requested
        } else if (typeof value === 'number') {
          // Legacy numeric sentiment - convert to label
          const label =
            value > 0.1 ? 'positive' : value < -0.1 ? 'negative' : 'neutral';
          formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
          unit = ''; // Remove emoji icons as requested
        } else {
          // Fallback for any other case
          formattedValue = typeof value === 'string' ? value : String(value);
          unit = '';
        }
      } else if (typeof value === 'number') {
        if (
          key.includes('score') ||
          key.includes('precision') ||
          key.includes('recall') ||
          key === 'f_score'
        ) {
          // Quality metrics: show as percentage for scores 0-1
          if (value >= 0 && value <= 1) {
            formattedValue = `${(value * 100).toFixed(1)}%`;
          } else {
            formattedValue = value.toFixed(3);
          }
        } else if (key.includes('flesch') || key === 'smog') {
          // Task 2: Readability Service - show readability scores with better handling
          const numValue = Number(value);
          if (isNaN(numValue)) {
            formattedValue = 'N/A';
            unit = '';
          } else {
            formattedValue = numValue.toFixed(1);
            unit = key === 'flesch_reading_ease' ? '/100' : '';
          }
        } else if (key.includes('count')) {
          formattedValue = Math.round(value);
        } else if (key === 'response_time_ms') {
          // Task 6: Basic latency logging
          formattedValue = `${value.toFixed(0)}ms`;
        } else if (key === 'estimated_cost_usd') {
          formattedValue = `$${value.toFixed(4)}`;
        } else {
          formattedValue = value.toFixed(2);
        }
      } else if (typeof value === 'object' && value !== null) {
        // NEW object handling for complex metrics
        if (key === 'keywords' && typeof value === 'object') {
          const kw = value as Record<string, unknown>;
          if ('foundCount' in kw && 'missingCount' in kw) {
            formattedValue = `${(kw.foundCount as number) || 0}/$ {
              ((kw.foundCount as number) || 0) + ((kw.missingCount as number) || 0)
            } found`;
            unit =
              'matchPercentage' in kw && typeof kw.matchPercentage === 'number'
                ? `(${(kw.matchPercentage || 0).toFixed(1)}%)`
                : '';
          } else {
            formattedValue = JSON.stringify(value);
          }
        } else if (key === 'is_valid_json' && typeof value === 'object') {
          const json = value as Record<string, unknown>;
          if ('isValid' in json) {
            formattedValue = json.isValid ? 'Valid' : 'Invalid';
            unit = json.isValid ? '✅' : '❌';
          } else {
            formattedValue = JSON.stringify(value);
          }
        } else if (key === 'sentiment_detailed') {
          // Task 3: Handle detailed sentiment breakdown for CardiffNLP - improved formatting
          const sentiment = value as Record<string, unknown>;
          if (
            'label' in sentiment &&
            'confidence' in sentiment &&
            'positive' in sentiment &&
            'negative' in sentiment &&
            'neutral' in sentiment
          ) {
            const label = sentiment.label as string;
            const confidence = sentiment.confidence as number;
            const positive = sentiment.positive as number;
            const negative = sentiment.negative as number;
            const neutral = sentiment.neutral as number;

            // Show the primary label and confidence, with breakdown in tooltip
            formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)} ${(confidence * 100).toFixed(1)}%`;
            unit = `(Pos: ${(positive * 100).toFixed(0)}%, Neg: ${(negative * 100).toFixed(0)}%, Neu: ${(neutral * 100).toFixed(0)}%)`;
          } else if ('compound' in sentiment) {
            const compound = sentiment.compound as number;
            const label =
              compound > 0.1
                ? 'positive'
                : compound < -0.1
                  ? 'negative'
                  : 'neutral';
            formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
            unit = `(${compound.toFixed(3)})`;
          } else {
            formattedValue = JSON.stringify(value);
          }
        } else {
          formattedValue = JSON.stringify(value, null, 2);
        }
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
        unit = value ? '✅' : '❌';
      } else if (typeof value === 'string') {
        // Handle string values (not already handled by sentiment above)
        formattedValue = value;
        unit = '';
      }

      categories[category].push([
        displayName,
        formattedValue.toString(),
        unit,
        description,
        value, // Store original value for color calculation
        key, // Store original key for color calculation
      ]);
    });

    return categories;
  };
  const categorizedMetrics = processMetrics(metrics);

  // Helper function to render a metric item
  const renderMetric = (
    name: string,
    value: string,
    unit?: string,
    description?: string,
    originalValue?: unknown,
    originalKey?: string,
    index?: number,
  ) => (
    <div
      key={`${name}-${index || 0}`}
      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/20 dark:bg-muted/10 border border-border/50"
      title={description}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium text-foreground/80">{name}</span>
        {description && (
          <div className="group relative">
            <span className="h-3 w-3 text-muted-foreground cursor-help text-xs">
              ℹ️
            </span>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 border border-border shadow-md">
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
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );

  // Helper function to render a category section
  const renderSection = (title: string, icon: string, categoryKey: string) => {
    const categoryMetrics = categorizedMetrics[categoryKey];
    if (!categoryMetrics || categoryMetrics.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm">{icon}</span>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <div className="space-y-1">
          {categoryMetrics.map(
            (
              [name, value, unit, description, originalValue, originalKey],
              index,
            ) =>
              renderMetric(
                name,
                value,
                unit,
                description,
                originalValue,
                originalKey,
                index,
              ),
          )}
        </div>
      </div>
    );
  };

  // Simplified neutral color for all metrics - no custom coloring
  const getScoreColor = (_value: unknown, _key: string): string => {
    // Use neutral color for all metrics to focus on functionality over styling
    return 'text-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button
            onClick={toggleCollapse}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            aria-label={isCollapsed ? 'Expand metrics' : 'Collapse metrics'}
          >
            <svg
              className={`h-4 w-4 transform transition-transform ${
                isCollapsed ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {!isCollapsed && (
          <div className="space-y-4">
            {/* All Metrics in Organized Sections - Compact Layout */}
            {renderSection('Quality Metrics', '🎯', 'quality')}
            {renderSection('Readability Analysis', '📖', 'readability')}
            {renderSection('Sentiment Analysis', '💭', 'sentiment')}
            {renderSection('Content Analysis', '📄', 'content')}
            {renderSection('Technical Metrics', '⚙️', 'technical')}

            {/* Empty state if no metrics */}
            {Object.values(categorizedMetrics).every(
              (cat) => cat.length === 0,
            ) && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No metrics available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
