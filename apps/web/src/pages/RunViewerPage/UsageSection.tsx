import React from 'react';
import Card from '../../components/ui/Card.js';
import type { JobDetails } from './types.js';

interface UsageSectionProps {
  job: JobDetails;
  darkMode: boolean;
}

const UsageSection: React.FC<UsageSectionProps> = ({ job, darkMode }) => {
  if (!job.tokensUsed && !job.costUsd) return null;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-pink-500 to-rose-600 text-white shadow-md">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <h3
            className={`text-lg font-semibold transition-colors duration-300 ${
              darkMode ? 'text-gray-200' : 'text-gray-900'
            }`}
          >
            Usage
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {job.tokensUsed && (
            <div
              className={`p-4 rounded-xl border transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-800/30 border-gray-700/50'
                  : 'bg-gray-50/30 border-gray-200/50'
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Tokens Used
              </div>
              <div
                className={`text-xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                {job.tokensUsed.toLocaleString()}
              </div>
            </div>
          )}
          {job.costUsd && (
            <div
              className={`p-4 rounded-xl border transition-colors duration-300 ${
                darkMode
                  ? 'bg-gray-800/30 border-gray-700/50'
                  : 'bg-gray-50/30 border-gray-200/50'
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 transition-colors duration-300 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Cost (USD)
              </div>
              <div
                className={`text-xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                ${job.costUsd.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UsageSection;
