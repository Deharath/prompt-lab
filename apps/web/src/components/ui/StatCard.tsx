import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  icon?: ReactNode;
  progress?: number; // 0-100 for progress bar
  category?: 'score' | 'performance' | 'cost' | 'count' | 'time' | 'other';
  isHighlight?: boolean;
}

const StatCard = ({
  title,
  value,
  unit,
  icon,
  progress,
  category = 'other',
  isHighlight = false,
}: StatCardProps) => {
  const getCategoryColor = () => {
    switch (category) {
      case 'score':
        return 'from-green-500 to-emerald-600';
      case 'performance':
        return 'from-blue-500 to-cyan-600';
      case 'cost':
        return 'from-orange-500 to-amber-600';
      case 'count':
        return 'from-purple-500 to-violet-600';
      case 'time':
        return 'from-indigo-500 to-blue-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl backdrop-blur-sm p-6 shadow-md ring-1 transition-all duration-300 group bg-white/60 dark:bg-gray-800/60 ring-gray-200/50 dark:ring-gray-700/50 hover:shadow-lg">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide transition-colors duration-300 text-gray-800 dark:text-gray-200">
            {title
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (str) => str.toUpperCase())}
          </h3>
          {isHighlight && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full transition-colors duration-300 bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          {icon && (
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg bg-linear-to-br ${getCategoryColor()} text-white shadow-sm`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline space-x-1">
          <div className="text-3xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
            {value}
          </div>
          {unit && (
            <div className="text-sm font-medium transition-colors duration-300 text-gray-500 dark:text-gray-400">
              {unit}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="relative h-2 rounded-full overflow-hidden transition-colors duration-300 bg-gray-200 dark:bg-gray-700">
            <div
              className={`absolute top-0 left-0 h-full bg-linear-to-r ${getCategoryColor()} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-400/10 dark:to-pink-400/10"></div>
    </div>
  );
};

export default StatCard;
