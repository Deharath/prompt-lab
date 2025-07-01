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
    await waitFor(
      () => {
        expect(screen.getByText('Evaluation Results')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Check that the metrics are displayed - use flexible matchers since formatting might vary
    const cosineElements = screen.getAllByText((content, element) => {
      return element?.textContent?.toLowerCase().includes('cosine') || false;
    });
    expect(cosineElements.length).toBeGreaterThan(0);

    const elements87 = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('87') || false;
    });
    expect(elements87.length).toBeGreaterThan(0);

    const accuracyElements = screen.getAllByText((content, element) => {
      return element?.textContent?.toLowerCase().includes('accuracy') || false;
    });
    expect(accuracyElements.length).toBeGreaterThan(0);

    const elements92 = screen.getAllByText((content, element) => {
      return element?.textContent?.includes('92') || false;
    });
    expect(elements92.length).toBeGreaterThan(0);

    // Verify final job fetch
    expect(global.fetch).toHaveBeenCalledWith('/jobs/job-123', {
      signal: expect.any(AbortSignal),
    });
  });
});
