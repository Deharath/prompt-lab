import { useState } from 'react';

interface FloatingActionButtonProps {
  onHistoryClick: () => void;
  onQuickStart: () => void;
  running: boolean;
  hasContent: boolean;
}

const FloatingActionButton = ({
  onHistoryClick,
  onQuickStart,
  running,
  hasContent,
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: (
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
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: 'History',
      onClick: onHistoryClick,
      color: 'from-blue-500 to-purple-600',
      show: true,
    },
    {
      icon: (
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
      ),
      label: 'Quick Start',
      onClick: onQuickStart,
      color: 'from-green-500 to-emerald-600',
      show: !hasContent, // Only show when user hasn't started
    },
  ].filter((action) => action.show);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Action Items */}
      <div
        className={`flex flex-col space-y-3 mb-3 transition-all duration-300 ${
          isOpen
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <div
            key={action.label}
            className={`transform transition-all duration-300 delay-${index * 50}`}
            style={{
              transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: isOpen
                ? `${index * 50}ms`
                : `${(actions.length - index) * 50}ms`,
            }}
          >
            <button
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              className={`group flex items-center space-x-3 bg-gradient-to-r ${action.color} text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex h-8 w-8 items-center justify-center">
                {action.icon}
              </div>
              <span className="font-medium pr-2">{action.label}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={running}
        title="Quick Actions"
        className={`group relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 ${
          running
            ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>

        {running ? (
          <div className="flex space-x-0.5">
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-1 h-1 bg-white rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
        ) : (
          <svg
            className={`h-6 w-6 text-white transition-transform duration-300 ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        )}
      </button>
    </div>
  );
};

export default FloatingActionButton;
