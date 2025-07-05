import React from 'react';
import DiffViewer from 'react-diff-viewer-continued';
import Card from '../ui/Card.js';
import type { JobDetails } from '../../api.js';

interface DiffOutputProps {
  baseJob: JobDetails;
  compareJob: JobDetails;
}

export const DiffOutput: React.FC<DiffOutputProps> = ({
  baseJob,
  compareJob,
}) => (
  <div role="tabpanel" id="output-panel" aria-labelledby="output-tab">
    <Card title="Output Comparison">
      <div className="p-6" role="region" aria-label="Output diff viewer">
        <DiffViewer
          oldValue={baseJob.result || ''}
          newValue={compareJob.result || ''}
          splitView
          leftTitle={`Base Job (${baseJob.id.substring(0, 8)})`}
          rightTitle={`Compare Job (${compareJob.id.substring(0, 8)})`}
          useDarkTheme={false}
          styles={{
            variables: {
              light: {
                diffViewerBackground: '#ffffff',
                diffViewerColor: '#0f172a',
                addedBackground: '#dcfce7',
                addedColor: '#166534',
                removedBackground: '#fef2f2',
                removedColor: '#dc2626',
                wordAddedBackground: '#bbf7d0',
                wordRemovedBackground: '#fecaca',
                addedGutterBackground: '#dcfce7',
                removedGutterBackground: '#fef2f2',
                gutterBackground: '#f8fafc',
                gutterBackgroundDark: '#f1f5f9',
                highlightBackground: '#f1f5f9',
                highlightGutterBackground: '#e2e8f0',
              },
            },
          }}
        />
      </div>
    </Card>
  </div>
);
