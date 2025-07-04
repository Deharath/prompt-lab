import React from 'react';
import Button from '../../components/ui/Button.js';
import ShareRunButton from '../../components/ShareRunButton.js';
import DarkModeToggle from './DarkModeToggle.js';

interface RunViewerHeaderProps {
  jobId: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

const RunViewerHeader: React.FC<RunViewerHeaderProps> = ({
  jobId,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <div
      className={`shadow-lg border-b transition-colors duration-300 ${
        darkMode
          ? 'bg-gray-800/90 backdrop-blur-sm border-gray-700/50'
          : 'bg-white/80 backdrop-blur-sm border-white/20'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => (window.location.href = '/')}
              variant="secondary"
              size="sm"
              icon={
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              }
            >
              Back to Lab
            </Button>
            <div>
              <h1
                className={`text-2xl font-bold transition-colors duration-300 ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}
              >
                Run Viewer
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Share Button */}
            <ShareRunButton jobId={jobId} />

            {/* Dark Mode Toggle */}
            <DarkModeToggle darkMode={darkMode} onToggle={onToggleDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunViewerHeader;
