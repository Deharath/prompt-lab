import Card from './ui/Card.js';
import ShareRunButton from './ShareRunButton.js';
import { useState, useEffect } from 'react';

interface ResultsPanelProps {
  metrics: Record<string, unknown> | undefined;
  jobId?: string;
  title?: string;
  showInsights?: boolean;
}

const ResultsPanel = ({
  metrics,
  jobId,
  title = 'Evaluation Results',
  showInsights = true,
}: ResultsPanelProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('evaluation-panel-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // Enhanced metric processing and validation - focus on meaningful metrics only
  const processMetrics = (metrics: Record<string, unknown>) => {
    const processed: Array<[string, number, string?]> = [];

    Object.entries(metrics).forEach(([key, value]) => {
      // Skip obsolete and redundant metrics
      if (
        key.includes('start') ||
        key.includes('end') ||
        key.includes('totalTokens') ||
        key.includes('avgCosSim') ||
        key.includes('evaluationCases') ||
        key.includes('meanLatency')
      ) {
        return; // Skip these obsolete metrics
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        processed.push([key, value]);
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex metric objects (e.g., JSON validity, keyword matches)
        const obj = value as Record<string, unknown>;
        if ('isValid' in obj) {
          processed.push([`${key}_validity`, obj.isValid ? 1 : 0, 'boolean']);
        }
        if ('foundCount' in obj && typeof obj.foundCount === 'number') {
          processed.push([`${key}_found_count`, obj.foundCount]);
        }
        if (
          'matchPercentage' in obj &&
          typeof obj.matchPercentage === 'number'
        ) {
          processed.push([
            `${key}_match_percentage`,
            obj.matchPercentage / 100,
          ]);
        }
        if ('errorMessage' in obj && obj.errorMessage) {
          processed.push([`${key}_has_error`, 1, 'boolean']);
        }
      } else if (typeof value === 'boolean') {
        processed.push([key, value ? 1 : 0, 'boolean']);
      }
    });

    return processed;
  };

  const processedMetrics = processMetrics(metrics);

  if (processedMetrics.length === 0) {
    return null;
  }

  // Enhanced metric categorization system
  const categorizeMetrics = (entries: Array<[string, number, string?]>) => {
    const categories = {
      classification: [] as Array<[string, number, string?]>,
      readability: [] as Array<[string, number, string?]>,
      content: [] as Array<[string, number, string?]>,
      structure: [] as Array<[string, number, string?]>,
      performance: [] as Array<[string, number, string?]>,
      cost: [] as Array<[string, number, string?]>,
      quality: [] as Array<[string, number, string?]>,
      other: [] as Array<[string, number, string?]>,
    };

    entries.forEach(([name, value, type]) => {
      const lowerName = name.toLowerCase();

      // Classification metrics (precision, recall, f-score, accuracy)
      if (
        lowerName.includes('precision') ||
        lowerName.includes('recall') ||
        lowerName.includes('f_score') ||
        lowerName.includes('fscore') ||
        lowerName.includes('f1') ||
        lowerName.includes('accuracy') ||
        lowerName.includes('classification')
      ) {
        categories.classification.push([name, value, type]);
      }
      // Readability metrics (Flesch Reading Ease, complexity)
      else if (
        lowerName.includes('flesch') ||
        lowerName.includes('reading') ||
        lowerName.includes('readability') ||
        lowerName.includes('complexity')
      ) {
        categories.readability.push([name, value, type]);
      }
      // Content analysis (sentiment, keywords, word count)
      else if (
        lowerName.includes('sentiment') ||
        lowerName.includes('emotion') ||
        lowerName.includes('tone') ||
        lowerName.includes('word') ||
        lowerName.includes('count') ||
        lowerName.includes('length') ||
        lowerName.includes('keywords') ||
        lowerName.includes('found') ||
        lowerName.includes('match')
      ) {
        categories.content.push([name, value, type]);
      }
      // Structure metrics (JSON validity, format compliance)
      else if (
        lowerName.includes('json') ||
        lowerName.includes('validity') ||
        lowerName.includes('valid') ||
        lowerName.includes('structure') ||
        lowerName.includes('format') ||
        lowerName.includes('error') ||
        type === 'boolean'
      ) {
        categories.structure.push([name, value, type]);
      }
      // Performance metrics (only meaningful response time)
      else if (
        lowerName.includes('response_time') ||
        lowerName.includes('duration')
      ) {
        categories.performance.push([name, value, type]);
      }
      // Cost metrics (only if actually useful)
      else if (
        lowerName.includes('cost') ||
        lowerName.includes('estimated_cost')
      ) {
        categories.cost.push([name, value, type]);
      }
      // Quality metrics (similarity, scores)
      else if (
        lowerName.includes('score') ||
        lowerName.includes('sim') ||
        lowerName.includes('similarity') ||
        lowerName.includes('quality') ||
        lowerName.includes('coherence') ||
        lowerName.includes('relevance')
      ) {
        categories.quality.push([name, value, type]);
      }
      // Everything else
      else {
        categories.other.push([name, value, type]);
      }
    });

    return categories;
  };

  const categorizedMetrics = categorizeMetrics(processedMetrics);

  // Enhanced metric value formatting
  const formatMetricValue = (name: string, value: number, type?: string) => {
    const lowerName = name.toLowerCase();

    // Boolean values
    if (type === 'boolean') {
      return value === 1 ? '✓ Valid' : '✗ Invalid';
    }

    // Percentage values (0-1 range)
    if (
      (lowerName.includes('precision') ||
        lowerName.includes('recall') ||
        lowerName.includes('f_score') ||
        lowerName.includes('sim') ||
        lowerName.includes('similarity') ||
        lowerName.includes('accuracy') ||
        lowerName.includes('match') ||
        (lowerName.includes('score') && value <= 1)) &&
      value >= 0 &&
      value <= 1
    ) {
      return `${(value * 100).toFixed(1)}%`;
    }

    // Reading ease scores (usually 0-100)
    if (lowerName.includes('flesch') || lowerName.includes('reading')) {
      const score = Math.round(value);
      let level = '';
      if (score >= 90) level = ' (Very Easy)';
      else if (score >= 80) level = ' (Easy)';
      else if (score >= 70) level = ' (Fairly Easy)';
      else if (score >= 60) level = ' (Standard)';
      else if (score >= 50) level = ' (Fairly Difficult)';
      else if (score >= 30) level = ' (Difficult)';
      else level = ' (Very Difficult)';
      return `${score}${level}`;
    }

    // Sentiment scores (-1 to 1)
    if (lowerName.includes('sentiment')) {
      const sentimentLabel =
        value > 0.1 ? 'Positive' : value < -0.1 ? 'Negative' : 'Neutral';
      const emoji = value > 0.1 ? '😊' : value < -0.1 ? '😞' : '😐';
      return `${emoji} ${sentimentLabel} (${value.toFixed(3)})`;
    }

    // Currency values (only estimated costs)
    if (
      lowerName.includes('estimated_cost') ||
      lowerName.includes('cost_usd')
    ) {
      return `$${value.toFixed(4)}`;
    }

    // Time values (response time)
    if (lowerName.includes('response_time') || lowerName.includes('duration')) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}s`;
      }
      return `${Math.round(value)}ms`;
    }

    // Word counts and other meaningful counts
    if (
      lowerName.includes('count') ||
      lowerName.includes('words') ||
      lowerName.includes('found')
    ) {
      return Math.round(value).toLocaleString();
    }

    // Default: 3 decimal places for scores
    return value.toFixed(3);
  };

  // Helper function to get appropriate icon for metric categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'classification':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'readability':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'content':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'structure':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'cost':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246C12.196 9.434 11.622 9.209 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246C7.804 10.566 8.378 10.791 9 10.908v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246C12.196 9.434 11.622 9.209 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5a1 1 0 10-2 0v.092z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'quality':
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'classification':
        return 'Classification Metrics';
      case 'readability':
        return 'Readability Metrics';
      case 'content':
        return 'Content Analysis';
      case 'structure':
        return 'Structure & Format';
      case 'performance':
        return 'Performance Metrics';
      case 'cost':
        return 'Cost Metrics';
      case 'quality':
        return 'Quality Metrics';
      default:
        return 'Other Metrics';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'classification':
        return 'from-green-500 to-emerald-600';
      case 'readability':
        return 'from-cyan-500 to-blue-600';
      case 'content':
        return 'from-orange-500 to-amber-600';
      case 'structure':
        return 'from-indigo-500 to-purple-600';
      case 'performance':
        return 'from-blue-500 to-indigo-600';
      case 'cost':
        return 'from-pink-500 to-rose-600';
      case 'quality':
        return 'from-purple-500 to-violet-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  }; // Generate insights based on metrics
  const generateInsights = () => {
    const insights: string[] = [];

    // Classification insights
    const classificationMetrics = categorizedMetrics.classification;
    if (classificationMetrics.length > 0) {
      const avgScore =
        classificationMetrics.reduce((sum, [, value]) => sum + value, 0) /
        classificationMetrics.length;
      if (avgScore > 0.8) {
        insights.push(
          '🎯 Excellent classification performance with high precision and recall',
        );
      } else if (avgScore > 0.6) {
        insights.push(
          '📊 Good classification results with room for improvement',
        );
      } else {
        insights.push(
          '⚠️ Classification metrics suggest potential issues with accuracy',
        );
      }
    }

    // Readability insights
    const readabilityMetrics = categorizedMetrics.readability;
    readabilityMetrics.forEach(([name, value]) => {
      if (name.toLowerCase().includes('flesch')) {
        if (value >= 70) {
          insights.push('📖 Content is easily readable by general audience');
        } else if (value >= 50) {
          insights.push('📚 Content has moderate reading difficulty');
        } else {
          insights.push('🎓 Content requires advanced reading skills');
        }
      }
    });

    // Content insights
    const contentMetrics = categorizedMetrics.content;
    contentMetrics.forEach(([name, value]) => {
      if (name.toLowerCase().includes('sentiment')) {
        if (value > 0.2) {
          insights.push('😊 Content has a positive sentiment');
        } else if (value < -0.2) {
          insights.push('😞 Content has a negative sentiment');
        } else {
          insights.push('😐 Content maintains neutral sentiment');
        }
      }
    });

    // Structure insights
    const structureMetrics = categorizedMetrics.structure;
    const validStructure = structureMetrics.some(
      ([name, value]) => name.toLowerCase().includes('valid') && value === 1,
    );
    if (validStructure) {
      insights.push('✅ Output follows proper structural format');
    }

    return insights;
  };

  const insights = showInsights ? generateInsights() : [];

  // Calculate summary statistics
  const totalMetrics = processedMetrics.length;
  const categoryCount = Object.values(categorizedMetrics).filter(
    (cat) => cat.length > 0,
  ).length;

  const classificationMetrics = categorizedMetrics.classification;
  const avgClassificationScore =
    classificationMetrics.length > 0
      ? classificationMetrics.reduce((sum, [, value]) => sum + value, 0) /
        classificationMetrics.length
      : null;

  return (
    <Card title={title}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
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
            <h2 className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={
                isCollapsed
                  ? 'Expand evaluation results'
                  : 'Collapse evaluation results'
              }
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
          {jobId && <ShareRunButton jobId={jobId} />}
        </div>

        {!isCollapsed && (
          <>
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Metrics
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {totalMetrics}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Categories
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {categoryCount}
                    </p>
                  </div>
                </div>
              </div>

              {avgClassificationScore !== null && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500 text-white">
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Avg Score
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatMetricValue('score', avgClassificationScore)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white mt-0.5">
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      AI Insights
                    </h3>
                    <ul className="space-y-1">
                      {insights.map((insight, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        >
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Categories
              </button>
              {Object.entries(categorizedMetrics).map(
                ([category, categoryMetrics]) => {
                  if (categoryMetrics.length === 0) return null;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {getCategoryTitle(category)} ({categoryMetrics.length})
                    </button>
                  );
                },
              )}
            </div>

            {/* Metrics Display */}
            <div className="space-y-6">
              {Object.entries(categorizedMetrics).map(
                ([category, categoryMetrics]) => {
                  if (categoryMetrics.length === 0) return null;
                  if (selectedCategory && selectedCategory !== category)
                    return null;

                  return (
                    <div key={category} className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br ${getCategoryColor(category)} text-white shadow-sm`}
                        >
                          {getCategoryIcon(category)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {getCategoryTitle(category)}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({categoryMetrics.length} metric
                          {categoryMetrics.length !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryMetrics.map(([name, value, type]) => (
                          <div
                            key={name}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  {name
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, (str) => str.toUpperCase())}
                                </h4>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                  {formatMetricValue(name, value, type)}
                                </p>
                              </div>
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getCategoryColor(category)} text-white shadow-sm opacity-60`}
                              >
                                {getCategoryIcon(category)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default ResultsPanel;
