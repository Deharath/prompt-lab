/**
 * Simple test to verify that Evaluation Results components work correctly with job status
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import UnifiedPanelResults from '../../src/components/features/prompt/unified-panel/UnifiedPanelResults.js';

describe('UnifiedPanelResults', () => {
  it('shows default message when no job provided', () => {
    render(createElement(UnifiedPanelResults, { metrics: null }));

    expect(screen.getByText('No Results Yet')).toBeInTheDocument();
    expect(
      screen.getByText('Run an evaluation to see metrics and analysis here'),
    ).toBeInTheDocument();
  });

  it('shows cancelled message for cancelled job', () => {
    const mockCancelledJob = {
      id: 'test-job',
      status: 'cancelled' as const,
      createdAt: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      costUsd: null,
      resultSnippet: null,
    };

    render(
      createElement(UnifiedPanelResults, {
        metrics: null,
        currentJob: mockCancelledJob,
      }),
    );

    expect(screen.getByText('Evaluation Cancelled')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This evaluation was cancelled and has no results to display',
      ),
    ).toBeInTheDocument();
  });

  it('shows failed message for failed job', () => {
    const mockFailedJob = {
      id: 'test-job',
      status: 'failed' as const,
      createdAt: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      costUsd: null,
      resultSnippet: null,
    };

    render(
      createElement(UnifiedPanelResults, {
        metrics: null,
        currentJob: mockFailedJob,
      }),
    );

    expect(screen.getByText('Evaluation Failed')).toBeInTheDocument();
    expect(
      screen.getByText('This evaluation failed and could not generate results'),
    ).toBeInTheDocument();
  });

  it('shows in progress message for running job', () => {
    const mockRunningJob = {
      id: 'test-job',
      status: 'running' as const,
      createdAt: new Date(),
      provider: 'openai',
      model: 'gpt-4',
      costUsd: null,
      resultSnippet: null,
    };

    render(
      createElement(UnifiedPanelResults, {
        metrics: null,
        currentJob: mockRunningJob,
      }),
    );

    expect(screen.getByText('Evaluation In Progress')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Results will appear here once the evaluation completes',
      ),
    ).toBeInTheDocument();
  });

  it('displays metrics when provided', () => {
    const mockMetrics = {
      sentiment: 0.8,
      word_count: 25,
      flesch_reading_ease: 75,
    };

    render(createElement(UnifiedPanelResults, { metrics: mockMetrics }));

    // Should not show the "No Results Yet" message when metrics are present
    expect(screen.queryByText('No Results Yet')).not.toBeInTheDocument();
  });
});
