import { describe, it, vi, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.js';

describe('App', () => {
  it('streams log and renders metrics', async () => {
    // Mock fetch for job history, job creation and final job fetch
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [], // Empty job history array
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'job-123', status: 'pending' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'job-123',
          status: 'completed',
          metrics: {
            totalTokens: 10,
            avgCosSim: 0.87,
            meanLatencyMs: 100,
            costUsd: 0.001,
          },
        }),
      }) as unknown as typeof fetch;

    // Mock EventSource - create a proper mock that can dispatch events
    let mockEventSource: any;
    const MockEventSourceClass = vi.fn().mockImplementation((url: string) => {
      mockEventSource = {
        url,
        onopen: null,
        onmessage: null,
        onerror: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        dispatchEvent: vi.fn(),
        readyState: 1,
      };

      // Simulate real streaming behavior after a short delay
      setTimeout(() => {
        // Simulate onopen
        if (mockEventSource.onopen) {
          mockEventSource.onopen({} as Event);
        }

        // Simulate data events with tokens
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage({
            data: JSON.stringify({ token: 'Hello' }),
          } as MessageEvent);
          mockEventSource.onmessage({
            data: JSON.stringify({ token: ' ' }),
          } as MessageEvent);
          mockEventSource.onmessage({
            data: JSON.stringify({ token: 'world!' }),
          } as MessageEvent);
        }

        // Simulate done event
        const doneListener = mockEventSource.addEventListener.mock.calls.find(
          (call: any[]) => call[0] === 'done',
        )?.[1];
        if (doneListener) {
          doneListener({
            data: JSON.stringify({ done: true }),
          } as MessageEvent);
        }

        // Simulate metrics event
        const metricsListener =
          mockEventSource.addEventListener.mock.calls.find(
            (call: any[]) => call[0] === 'metrics',
          )?.[1];
        if (metricsListener) {
          metricsListener({
            data: JSON.stringify({
              totalTokens: 10,
              avgCosSim: 0.87,
              meanLatencyMs: 100,
              costUsd: 0.001,
            }),
          } as MessageEvent);
        }
      }, 100);

      return mockEventSource;
    });

    (globalThis as any).EventSource = MockEventSourceClass;

    render(<App />);

    // Click the "Get Started!" button to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Wait for the prompt editor to appear after clicking "Get Started!"
    await waitFor(() => {
      expect(screen.getByTestId('prompt-editor')).toBeInTheDocument();
    });

    // Set up the prompt and run
    fireEvent.change(screen.getByTestId('prompt-editor'), {
      target: { value: 'hi' },
    });
    fireEvent.click(screen.getByText('Run Evaluation'));

    // Verify job creation call - should use the prompt the user typed in
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'hi',
          provider: 'openai',
          model: 'gpt-4o-mini',
        }),
        signal: expect.any(AbortSignal),
      });
    });

    // Wait for the log to appear
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /output stream/i }),
      ).toBeInTheDocument();
    });

    // Switch to Raw view
    fireEvent.click(screen.getByRole('button', { name: /raw/i }));

    // Now check for streamed text tokens
    await waitFor(
      () => {
        expect(screen.getByText('Hello world!')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Wait for metrics to appear
    await waitFor(
      () => {
        expect(screen.getByText('Evaluation Results')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Check that the metrics are displayed - use flexible matchers since formatting might vary
    const elements87 = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('87') || false;
    });
    expect(elements87.length).toBeGreaterThan(0);

    // Verify final job fetch
    expect(global.fetch).toHaveBeenCalledWith('/jobs/job-123', {
      signal: expect.any(AbortSignal),
    });
  });
});
