interface LogEntry {
  text: string;
}

interface DebugPanelProps {
  running: boolean;
  log: LogEntry[];
  metrics: Record<string, number> | undefined;
  provider: string;
  model: string;
  template: string;
}

const DebugPanel = ({
  running,
  log,
  metrics,
  provider,
  model,
  template,
}: DebugPanelProps) => {
  // Only show in development environment
  if (!import.meta.env.DEV) {
    return null;
  }

  const debugStats = [
    {
      label: 'Status',
      value: running ? 'Running' : 'Idle',
      color: running ? 'green' : 'gray',
    },
    { label: 'Log Entries', value: log.length.toString(), color: 'blue' },
    {
      label: 'Metrics',
      value:
        metrics && Object.keys(metrics).length > 0
          ? Object.keys(metrics).length.toString()
          : '0',
      color: 'purple',
    },
    { label: 'Provider', value: provider, color: 'indigo' },
    { label: 'Model', value: model, color: 'pink' },
    {
      label: 'Template Length',
      value: `${template.length} chars`,
      color: 'yellow',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl ring-1 ring-gray-200/50">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/50"></div>
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Debug Panel</h3>
          <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
            DEV
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {debugStats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-lg bg-white/60 backdrop-blur-sm p-4 shadow-sm ring-1 ring-gray-200/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-sm font-bold text-gray-900">
                    {stat.value}
                  </div>
                </div>
                <div
                  className={`w-2 h-8 rounded-full ${
                    stat.color === 'green'
                      ? 'bg-green-400'
                      : stat.color === 'blue'
                        ? 'bg-blue-400'
                        : stat.color === 'purple'
                          ? 'bg-purple-400'
                          : stat.color === 'indigo'
                            ? 'bg-indigo-400'
                            : stat.color === 'pink'
                              ? 'bg-pink-400'
                              : stat.color === 'yellow'
                                ? 'bg-yellow-400'
                                : 'bg-gray-400'
                  }`}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Log Entries */}
        {log.length > 0 && (
          <div className="p-3 bg-white/40 backdrop-blur-sm rounded-lg border border-gray-200/50">
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wide mb-2">
              Recent Log Activity
            </div>
            <div className="text-sm text-gray-800 font-mono bg-gray-100/50 p-2 rounded border max-h-20 overflow-y-auto">
              {log.slice(-3).map((entry) => (
                <div
                  key={entry.text}
                  className="text-xs text-gray-700 truncate"
                >
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
