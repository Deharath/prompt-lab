import { useState, useEffect } from 'react';
import PromptEditor from './PromptEditor.js';
import InputEditor from './InputEditor.js';

interface UnifiedPanelProps {
  // Input & Prompt props
  template: string;
  inputData: string;
  onTemplateChange: (value: string) => void;
  onInputDataChange: (value: string) => void;
  model: string;
  onStartWithExample: () => void;
  isEmptyState: boolean;

  // Results props
  metrics: Record<string, unknown> | undefined;
  hasResults: boolean;
}

const UnifiedPanel = ({
  template,
  inputData,
  onTemplateChange,
  onInputDataChange,
  model,
  onStartWithExample,
  isEmptyState,
  metrics,
  hasResults,
}: UnifiedPanelProps) => {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

  // Auto-switch to results when metrics first become available, but allow manual switching back
  useEffect(() => {
    if (hasResults && activeTab === 'input') {
      // Only auto-switch if user hasn't manually selected results tab before
      const hasManuallySelectedTab = sessionStorage.getItem(
        'unifiedPanel-manualTab',
      );
      if (!hasManuallySelectedTab) {
        setActiveTab('results');
      }
    }
  }, [hasResults, activeTab]);

  const handleTabChange = (tab: 'input' | 'results') => {
    setActiveTab(tab);
    // Remember that user has manually selected a tab
    sessionStorage.setItem('unifiedPanel-manualTab', 'true');
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Header with Tab Buttons */}
      <div className="border-b border-border bg-muted/20">
        <div className="flex items-center">
          <button
            onClick={() => handleTabChange('input')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              activeTab === 'input'
                ? 'bg-background text-foreground border-b-2 border-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Input & Prompt</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('results')}
            disabled={!hasResults}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
              activeTab === 'results'
                ? 'bg-background text-foreground border-b-2 border-primary shadow-sm'
                : hasResults
                  ? 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
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
              <span>Evaluation Results</span>
              {hasResults && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {activeTab === 'input' ? (
          // Input & Prompt Content
          <div className="space-y-6">
            {isEmptyState ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4" aria-hidden="true">
                  <svg
                    className="h-12 w-12 mx-auto mb-4 opacity-60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Create your first prompt
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Write a prompt template with input placeholders like{' '}
                  <code className="px-2 py-1 text-xs font-mono bg-muted/50 border border-border rounded text-foreground">
                    {'{{input}}'}
                  </code>
                </p>
                <button
                  onClick={onStartWithExample}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Get Started!
                </button>
              </div>
            ) : (
              <>
                {/* Modern Prompt Template Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Prompt Template
                    </h4>
                  </div>
                  <PromptEditor
                    value={template}
                    onChange={onTemplateChange}
                    model={model}
                  />
                </div>

                {/* Modern Input Data Section */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-green-600 dark:text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Input Data
                    </h4>
                  </div>
                  <InputEditor
                    value={inputData}
                    onChange={onInputDataChange}
                    placeholder="Enter your input data here..."
                    model={model}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          // Results Content - Direct metrics without extra wrapper
          <div className="space-y-4">
            {hasResults ? (
              <div className="space-y-4">
                {/* Render metrics directly without the extra card wrapper */}
                {(() => {
                  if (!metrics || Object.keys(metrics).length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">
                          <svg
                            className="h-12 w-12 mx-auto mb-4 opacity-60"
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
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No Results Yet
                        </h3>
                        <p className="text-muted-foreground">
                          Run an evaluation to see metrics and analysis here
                        </p>
                      </div>
                    );
                  }

                  // Process metrics inline - based on ResultsPanelV2 logic
                  const processMetrics = (metrics: Record<string, unknown>) => {
                    const categories: Record<
                      string,
                      Array<
                        [string, string, string?, string?, unknown?, string?]
                      >
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
                        description:
                          'Balanced measure of content precision and recall',
                      },
                      precision: {
                        category: 'quality',
                        displayName: 'Content Precision',
                        description:
                          'How much of the output is relevant to the input',
                      },
                      recall: {
                        category: 'quality',
                        displayName: 'Content Recall',
                        description:
                          'How much of the input is covered in the output',
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
                        description:
                          'Text readability (0-100, higher = easier)',
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

                      let formattedValue: string | number = value as
                        | string
                        | number;
                      let unit = '';

                      // Handle sentiment specially
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
                          formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)} ${(confidence * 100).toFixed(1)}%`;
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
                            value > 0.1
                              ? 'positive'
                              : value < -0.1
                                ? 'negative'
                                : 'neutral';
                          formattedValue = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
                        } else {
                          formattedValue =
                            typeof value === 'string' ? value : String(value);
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

                          formattedValue = `Positive: ${(positive * 100).toFixed(0)}%, Negative: ${(negative * 100).toFixed(0)}%, Neutral: ${(neutral * 100).toFixed(0)}%`;
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
                            typeof value === 'string'
                              ? value
                              : JSON.stringify(value);
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

                  const categorizedMetrics = processMetrics(metrics);

                  const renderMetric = (
                    name: string,
                    value: string,
                    unit?: string,
                    description?: string,
                    isWide?: boolean,
                  ) => (
                    <div
                      key={name}
                      className={`flex flex-col p-3 rounded-md bg-muted/20 border border-border/50 min-h-[60px] ${isWide ? 'col-span-2' : ''}`}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xs font-medium text-foreground/80 line-clamp-1 flex-1">
                          {name}
                        </span>
                        {description && (
                          <div className="group relative">
                            <div className="h-4 w-4 rounded-full bg-muted-foreground/20 text-muted-foreground cursor-help text-xs flex items-center justify-center flex-shrink-0 border border-muted-foreground/30">
                              ?
                            </div>
                            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-border shadow-md">
                              {description}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center">
                        <span
                          className={`text-sm font-semibold text-foreground leading-tight ${isWide ? 'whitespace-nowrap' : 'break-words'}`}
                        >
                          {value}
                        </span>
                        {unit && (
                          <span className="text-xs text-muted-foreground ml-1 flex-shrink-0">
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
                  ) => {
                    const categoryMetrics = categorizedMetrics[categoryKey];
                    if (!categoryMetrics || categoryMetrics.length === 0)
                      return null;

                    return (
                      <div key={categoryKey} className="mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-sm">{icon}</span>
                          <h4 className="text-sm font-semibold text-foreground">
                            {title}
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {categoryMetrics.map(
                            ([name, value, unit, description]) =>
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

                  return (
                    <div className="space-y-4">
                      {renderSection('Quality Metrics', '🎯', 'quality')}
                      {renderSection(
                        'Readability Analysis',
                        '📖',
                        'readability',
                      )}
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
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <svg
                    className="h-12 w-12 mx-auto mb-4 opacity-60"
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
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Results Yet
                </h3>
                <p className="text-muted-foreground">
                  Run an evaluation to see metrics and analysis here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedPanel;
