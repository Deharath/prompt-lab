import React from 'react';
import Card from '../../components/ui/Card.js';
import Button from '../../components/ui/Button.js';
import type { JobDetails } from './types.js';

interface ConfigurationSectionProps {
  job: JobDetails;
}

const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({ job }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-md">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 dark:text-gray-200">
            Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Provider Selector (Disabled) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 transition-colors duration-300 dark:text-gray-300">
              Provider
            </label>
            <select
              value={job.provider}
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200/50 bg-gray-50/50 px-4 py-3 font-medium text-gray-500 opacity-60 transition-colors duration-300 dark:border-gray-600/50 dark:bg-gray-800/50 dark:text-gray-400"
            >
              <option value={job.provider}>{job.provider}</option>
            </select>
          </div>

          {/* Model Selector (Disabled) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 transition-colors duration-300 dark:text-gray-300">
              Model
            </label>
            <select
              value={job.model}
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-xl border-2 border-gray-200/50 bg-gray-50/50 px-4 py-3 font-medium text-gray-500 opacity-60 transition-colors duration-300 dark:border-gray-600/50 dark:bg-gray-800/50 dark:text-gray-400"
            >
              <option value={job.model}>{job.model}</option>
            </select>
          </div>
        </div>

        {/* Run Button (Disabled) */}
        <div className="mt-6">
          <Button
            disabled
            aria-disabled="true"
            variant="primary"
            size="lg"
            fullWidth
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          >
            Run Evaluation (Read-Only)
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConfigurationSection;
