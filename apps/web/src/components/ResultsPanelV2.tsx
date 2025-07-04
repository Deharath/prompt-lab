import Card from './ui/Card.js';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('quality');

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
      Array<[string, number | string | object, string?, string?]>
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
          'DistilBERT (accurate) or VADER (fast) based on SENTIMENT_MODE env',
      },
      sentiment_detailed: {
        category: 'sentiment',
        displayName: 'Detailed Sentiment',
        description:
          'Full sentiment breakdown with positive/negative/neutral scores',
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

      if (typeof value === 'number') {
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
        } else if (key === 'sentiment') {
          // Task 3: Sentiment Service formatting
          formattedValue = value.toFixed(3);
          unit = value > 0.1 ? '😊' : value < -0.1 ? '😟' : '😐';
        } else if (key.includes('flesch') || key === 'smog') {
          // Task 2: Readability Service - show readability scores
          formattedValue = value.toFixed(1);
          unit = key === 'flesch_reading_ease' ? '/100' : '';
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
                ? `(${((kw.matchPercentage as number) || 0).toFixed(1)}%)`
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
          // Task 3: Handle detailed sentiment breakdown
          const sentiment = value as Record<string, unknown>;
          if ('compound' in sentiment) {
            formattedValue = `Compound: ${typeof sentiment.compound === 'number' ? sentiment.compound.toFixed(3) : 'N/A'}`;
            unit = '';
          } else {
            formattedValue = JSON.stringify(value);
          }
        } else {
          formattedValue = JSON.stringify(value, null, 2);
        }
      } else if (typeof value === 'boolean') {
        formattedValue = value ? 'Yes' : 'No';
        unit = value ? '✅' : '❌';
      }

      categories[category].push([
        displayName,
        formattedValue,
        unit,
        description,
      ]);
    });

    return categories;
  };
  const categorizedMetrics = processMetrics(metrics);
  const categories = [
    { id: 'quality', name: 'Quality', icon: '🎯' },
    { id: 'readability', name: 'Readability', icon: '📖' },
    { id: 'sentiment', name: 'Sentiment', icon: '💭' },
    { id: 'content', name: 'Content', icon: '📄' },
    { id: 'technical', name: 'Technical', icon: '⚙️' },
  ].filter((cat) => categorizedMetrics[cat.id].length > 0);

  // Updated scoring colors for NEW metrics system
  const getScoreColor = (value: string | number, key: string): string => {
    if (typeof value !== 'number') return 'text-gray-600 dark:text-gray-400';

    // NEW quality metrics (Task 7 focus)
    if (
      key.includes('score') ||
      key.includes('precision') ||
      key.includes('recall') ||
      key === 'f_score'
    ) {
      if (value >= 0.8) return 'text-green-600 dark:text-green-400';
      if (value >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-red-600 dark:text-red-400';
    }

    // Task 2: Readability scoring
    if (key === 'flesch_reading_ease') {
      if (value >= 60) return 'text-green-600 dark:text-green-400'; // Easy to read
      if (value >= 30) return 'text-yellow-600 dark:text-yellow-400'; // Moderate
      return 'text-red-600 dark:text-red-400'; // Difficult
    }

    if (key === 'flesch_kincaid' || key === 'smog') {
      if (value <= 8) return 'text-green-600 dark:text-green-400'; // Grade level 8 or below
      if (value <= 12) return 'text-yellow-600 dark:text-yellow-400'; // High school level
      return 'text-red-600 dark:text-red-400'; // College level+
    }

    // Task 3: Sentiment scoring
    if (key === 'sentiment') {
      if (value > 0.2) return 'text-green-600 dark:text-green-400';
      if (value < -0.2) return 'text-red-600 dark:text-red-400';
      return 'text-gray-600 dark:text-gray-400';
    }

    // Task 6: Response time scoring
    if (key === 'response_time_ms') {
      if (value <= 1000) return 'text-green-600 dark:text-green-400'; // Under 1s
      if (value <= 3000) return 'text-yellow-600 dark:text-yellow-400'; // Under 3s
      return 'text-red-600 dark:text-red-400'; // Over 3s
    }

    return 'text-gray-700 dark:text-gray-300';
  };

  return (
    <Card>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-purple-500 to-indigo-600 text-white shadow-md">
              <svg
                className="h-4 w-4"
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <button
            onClick={toggleCollapse}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            aria-label={isCollapsed ? 'Expand metrics' : 'Collapse metrics'}
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${
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
          <>
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="flex space-x-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Display */}
            <div className="space-y-3">
              {categorizedMetrics[selectedCategory]?.map(
                ([name, value, unit, description], index) => (
                  <div
                    key={`${selectedCategory}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    title={description}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {name}
                      </span>
                      {description && (
                        <div className="group relative">
                          <span className="h-4 w-4 text-gray-400 cursor-help">
                            ℹ️
                          </span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {description}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm font-semibold ${getScoreColor(
                          typeof value === 'object' ? 0 : value,
                          name.toLowerCase(),
                        )}`}
                      >
                        {typeof value === 'object'
                          ? JSON.stringify(value)
                          : value}
                      </span>
                      {unit && <span className="text-sm">{unit}</span>}
                    </div>
                  </div>
                ),
              )}

              {categorizedMetrics[selectedCategory]?.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No metrics available in this category</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default ResultsPanel;
