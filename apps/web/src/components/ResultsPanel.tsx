import Card from './ui/Card.js';
import StatCard from './ui/StatCard.js';

interface ResultsPanelProps {
  metrics: Record<string, number> | undefined;
}

const ResultsPanel = ({ metrics }: ResultsPanelProps) => {
  if (!metrics || Object.keys(metrics).length === 0) {
    return null;
  }

  const metricEntries = Object.entries(metrics);
  const maxScore = Math.max(...metricEntries.map(([, score]) => score));

  return (
    <Card gradient="purple">
      <div className="p-8 space-y-6">
        {/* Header */}
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
            Evaluation Results
          </h2>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricEntries.map(([name, score]) => {
            // Better metric categorization and display
            const getMetricDisplay = (metricName: string, value: number) => {
              const lowerName = metricName.toLowerCase();

              // Time-based metrics (ms)
              if (lowerName.includes('latency') || lowerName.includes('time')) {
                if (lowerName.includes('start') || lowerName.includes('end')) {
                  return {
                    displayValue: new Date(value).toLocaleTimeString(),
                    unit: '',
                    showBar: false,
                    category: 'time' as const,
                  };
                }
                return {
                  displayValue: `${value.toFixed(0)}`,
                  unit: 'ms',
                  showBar: false,
                  category: 'performance' as const,
                };
              }

              // Cost metrics
              if (lowerName.includes('cost')) {
                return {
                  displayValue: `$${value.toFixed(4)}`,
                  unit: '',
                  showBar: false,
                  category: 'cost' as const,
                };
              }

              // Count metrics
              if (
                lowerName.includes('tokens') ||
                lowerName.includes('cases') ||
                lowerName.includes('metrics')
              ) {
                return {
                  displayValue: Math.round(value).toLocaleString(),
                  unit: lowerName.includes('tokens') ? 'tokens' : 'items',
                  showBar: false,
                  category: 'count' as const,
                };
              }

              // Similarity/Score metrics (0-1 range)
              if (
                lowerName.includes('sim') ||
                (lowerName.includes('score') && value <= 1)
              ) {
                return {
                  displayValue: `${(value * 100).toFixed(1)}%`,
                  unit: '',
                  showBar: true,
                  category: 'score' as const,
                };
              }

              // Default for other metrics
              return {
                displayValue: value.toFixed(3),
                unit: '',
                showBar: value >= 0 && value <= 1,
                category: 'other' as const,
              };
            };

            const display = getMetricDisplay(
              name,
              typeof score === 'number' ? score : 0,
            );
            const isHighScore =
              display.category === 'score' && (score as number) >= 0.8;
            const progress =
              display.showBar && typeof score === 'number'
                ? score * 100
                : undefined;

            // Get appropriate icon for each category
            const getIcon = (category: string) => {
              switch (category) {
                case 'score':
                  return (
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  );
                case 'performance':
                  return (
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  );
                case 'cost':
                  return (
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  );
                case 'count':
                  return (
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  );
                default:
                  return (
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  );
              }
            };

            return (
              <StatCard
                key={name}
                title={name}
                value={display.displayValue}
                unit={display.unit}
                icon={getIcon(display.category)}
                progress={progress}
                category={display.category}
                isHighlight={isHighScore}
              />
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 backdrop-blur-sm rounded-xl border transition-colors duration-300 bg-white/40 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                {metricEntries.length}
              </div>
              <div className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
                Total Metrics
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                {typeof maxScore === 'number'
                  ? maxScore >= 0 && maxScore <= 1
                    ? `${(maxScore * 100).toFixed(1)}%`
                    : maxScore.toFixed(3)
                  : 'N/A'}
              </div>
              <div className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
                Best Score
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                {(() => {
                  const validScores = metricEntries
                    .filter(([, score]) => typeof score === 'number')
                    .map(([, score]) => score as number);
                  if (validScores.length === 0) return 'N/A';
                  const avg =
                    validScores.reduce((sum, score) => sum + score, 0) /
                    validScores.length;
                  return avg >= 0 && avg <= 1
                    ? `${(avg * 100).toFixed(1)}%`
                    : avg.toFixed(3);
                })()}
              </div>
              <div className="text-sm transition-colors duration-300 text-gray-600 dark:text-gray-400">
                Average
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResultsPanel;
