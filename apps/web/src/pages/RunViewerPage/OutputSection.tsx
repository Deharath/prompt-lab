import Card from '../../components/ui/Card.js';
import ShareRunButton from '../../components/shared/ShareRunButton.js';
import { JobDetails } from './types.js';
import { useDarkModeStore } from '../../store/darkModeStore.js';

interface OutputSectionProps {
  job: JobDetails;
}

export const OutputSection = ({ job }: OutputSectionProps) => {
  const { isDarkMode } = useDarkModeStore();
  if (!job?.result) return null;

  return (
    <Card>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-emerald-600 text-white shadow-md">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3
              className={`text-lg font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-900'
              }`}
            >
              Output
            </h3>
          </div>
          <ShareRunButton jobId={job.id} />
        </div>

        <div
          className={`min-h-[200px] w-full rounded-xl border-2 p-4 font-mono text-sm whitespace-pre-wrap transition-colors duration-300 ${
            isDarkMode
              ? 'border-gray-600/50 bg-gray-800/50 text-gray-300'
              : 'border-gray-200/50 bg-gray-50/50 text-gray-700'
          }`}
          role="region"
          aria-label="Job output"
        >
          {job.result}
        </div>
      </div>
    </Card>
  );
};
