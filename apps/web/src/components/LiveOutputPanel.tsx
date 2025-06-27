interface LogEntry {
  text: string;
}

interface LiveOutputPanelProps {
  log: LogEntry[];
  running: boolean;
}

const LiveOutputPanel = ({ log, running }: LiveOutputPanelProps) => {
  if (log.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live Output</h2>
        {running && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Streaming...</span>
          </div>
        )}
      </div>
      <div className="bg-gray-900 rounded-md p-4 h-64 overflow-auto">
        <div className="text-green-400 font-mono text-sm space-y-1">
          {log.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap">
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveOutputPanel;
