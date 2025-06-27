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

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <h3 className="text-sm font-medium text-yellow-800">Debug Info</h3>
      <div className="text-xs text-yellow-700 mt-2 space-y-1">
        <div>Running: {running ? 'YES' : 'NO'}</div>
        <div>Log entries: {log.length}</div>
        <div>
          Has metrics:{' '}
          {metrics && Object.keys(metrics).length > 0 ? 'YES' : 'NO'}
        </div>
        <div>Provider: {provider}</div>
        <div>Model: {model}</div>
        <div>Template: "{template}"</div>
      </div>
    </div>
  );
};

export default DebugPanel;
