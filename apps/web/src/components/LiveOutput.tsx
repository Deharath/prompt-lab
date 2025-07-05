import React from 'react';
import { useLiveOutput } from '../../hooks/useLiveOutput';
import { LiveOutputHeader } from './live-output/LiveOutputHeader';
import { LiveOutputDisplay } from './live-output/LiveOutputDisplay';

interface LiveOutputProps {
  outputText: string;
  status: 'streaming' | 'complete' | 'error';
}

export function LiveOutput({ outputText, status }: LiveOutputProps) {
  const { viewMode, setViewMode, copied, handleCopy, outputRef, safeMarkdown } =
    useLiveOutput(outputText, status);

  return (
    <div
      className="space-y-4"
      role="region"
      aria-labelledby="output-stream-heading"
    >
      <LiveOutputHeader
        status={status}
        viewMode={viewMode}
        setViewMode={setViewMode}
        copied={copied}
        handleCopy={handleCopy}
      />
      <LiveOutputDisplay
        outputRef={outputRef}
        viewMode={viewMode}
        safeMarkdown={safeMarkdown}
        outputText={outputText}
      />
    </div>
  );
}

export default LiveOutput;
