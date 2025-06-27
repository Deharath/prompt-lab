import { describe, it, vi, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.js';

describe('App', () => {
  it('streams log and renders metrics', async () => {
    // Mock fetch for job creation and final job fetch
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-123', status: 'pending' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'completed',
          metrics: { cosineSim: 0.87, accuracy: 0.92 },
        }),
      }) as unknown as typeof fetch;

    // Mock EventSource

    const mockEventSource = new (globalThis as any).EventSource('test');

    vi.spyOn(globalThis as any, 'EventSource').mockImplementation(
      () => mockEventSource,
    );

    render(<App />);

    // Set up the prompt and run
    fireEvent.change(screen.getByTestId('prompt-editor'), {
      target: { value: 'hi {{input}}' },
    });
    fireEvent.click(screen.getByText('Run Evaluation'));

    // Verify job creation call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'hi {{input}}',
          provider: 'openai',
          model: 'gpt-4o-mini',
        }),
        signal: expect.any(AbortSignal),
      });
    });

    // Simulate streaming messages
    mockEventSource.emit('Processing test case 1...');
    mockEventSource.emit('Evaluating with model...');
    mockEventSource.emit('[DONE]');

    // Wait for the log to appear
    await waitFor(() => {
      expect(screen.getByText('Live Output')).toBeInTheDocument();
      expect(screen.getByText('Processing test case 1...')).toBeInTheDocument();
      expect(screen.getByText('Evaluating with model...')).toBeInTheDocument();
    });

    // Wait for metrics to appear
    await waitFor(() => {
      expect(screen.getByText('Results')).toBeInTheDocument();
      expect(screen.getByText('cosineSim')).toBeInTheDocument();
      expect(screen.getByText('0.870')).toBeInTheDocument();
      expect(screen.getByText('accuracy')).toBeInTheDocument();
      expect(screen.getByText('0.920')).toBeInTheDocument();
    });

    // Verify final job fetch
    expect(global.fetch).toHaveBeenCalledWith('/jobs/job-123', {
      signal: expect.any(AbortSignal),
    });
  });
});
