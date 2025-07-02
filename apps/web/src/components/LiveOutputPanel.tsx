import Card from './ui/Card.js';

interface LogEntry {
  text: string;
}

interface LiveOutputProps {
  log: LogEntry[];
  running: boolean;
}

const LiveOutput = ({ log, running }: LiveOutputProps) => {
  if (log.length === 0 && !running) {
    return null;
  }

  return (
    <Card>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-green-500 to-blue-600 text-white shadow-md">
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
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v11a2 2 0 002 2h8a2 2 0 002-2V7M9 7h6"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Live Output
            </h2>
          </div>

          {running && (
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full transition-colors duration-300 text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/50">
                Streaming
              </span>
            </div>
          )}
        </div>

        {/* Terminal Output */}
        <div className="relative">
          <div
            className="rounded-xl p-6 min-h-[300px] max-h-[500px] overflow-auto shadow-inner transition-colors duration-300 bg-linear-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-900 dark:to-gray-800"
            aria-live="polite"
            aria-label="Live output stream"
          >
            {/* Terminal Header */}
            <div className="flex items-center space-x-2 mb-4 pb-3 border-b transition-colors duration-300 border-gray-700 dark:border-gray-600">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-gray-400 text-sm font-mono ml-4">
                Output Stream
              </div>
            </div>

            {/* Content */}
            <div className="text-green-400 font-mono text-sm space-y-1">
              {log.length === 0 && running ? (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full"></div>
                  <span>Waiting for output...</span>
                </div>
              ) : (
                log.map((l, i) => (
                  <div
                    key={i}
                    className="whitespace-pre-wrap rounded px-2 py-1 transition-colors duration-200 hover:bg-gray-800/50 dark:hover:bg-gray-700/50"
                  >
                    <span className="text-gray-500 mr-2">›</span>
                    {l.text}
                  </div>
                ))
              )}

              {running && log.length > 0 && (
                <div className="flex items-center space-x-2 text-gray-500 mt-2">
                  <div className="animate-pulse h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs">Streaming in progress...</span>
                </div>
              )}
            </div>
          </div>

          {/* Gradient overlay for better readability */}
          <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none transition-colors duration-300 bg-linear-to-t from-gray-900 to-transparent dark:from-black"></div>
        </div>
      </div>
    </Card>
  );
};

export default LiveOutput;
