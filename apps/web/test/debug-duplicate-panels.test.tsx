/**
 * Debug test to understand why multiple ConfigurationPanels are being rendered
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.js';

describe('Debug duplicate panels', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for job creation
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'job-123', status: 'pending' }),
    });

    // Mock EventSource
    global.EventSource = vi.fn().mockImplementation((url) => {
      const mockES = {
        close: vi.fn(),
        addEventListener: vi.fn(),
        onopen: null as (() => void) | null,
        onmessage: null as ((event: MessageEvent) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        readyState: 1,
        url,
        withCredentials: false,
        CONNECTING: 0 as const,
        OPEN: 1 as const,
        CLOSED: 2 as const,
        dispatchEvent: vi.fn(),
        removeEventListener: vi.fn(),
      };

      // Simulate immediate connection
      setTimeout(() => {
        if (mockES.onopen) mockES.onopen();
      }, 0);

      return mockES;
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render only one ConfigurationPanel after running and changing provider', async () => {
    render(<App />);

    // Click "Get Started!" to populate the workspace
    fireEvent.click(screen.getByText('Get Started!'));

    // Wait for editors to appear and modify them
    await waitFor(() => {
      expect(screen.getAllByTestId('prompt-editor')).toHaveLength(1);
      expect(screen.getAllByTestId('input-editor')).toHaveLength(1);
    });

    const promptEditors = screen.getAllByTestId('prompt-editor');
    const inputEditors = screen.getAllByTestId('input-editor');

    fireEvent.change(promptEditors[0], {
      target: { value: 'Test prompt {{input}}' },
    });

    fireEvent.change(inputEditors[0], {
      target: { value: 'Test input data' },
    });

    // Click run button to start evaluation
    const runButton = await waitFor(() => {
      const buttons = screen.queryAllByRole('button', {
        name: /Run Evaluation/i,
      });
      expect(buttons).toHaveLength(1);
      return buttons[0];
    });

    fireEvent.click(runButton);

    // After starting evaluation, should be in loading state
    await waitFor(() => {
      const loadingButtons = screen.queryAllByRole('button', {
        name: /Loading/i,
      });
      expect(loadingButtons).toHaveLength(1);

      console.log('=== AFTER STARTING EVALUATION ===');
      console.log(
        'Prompt editors:',
        screen.queryAllByTestId('prompt-editor').length,
      );
      console.log(
        'Input editors:',
        screen.queryAllByTestId('input-editor').length,
      );
      console.log('Loading buttons:', loadingButtons.length);
      console.log(
        'Run buttons:',
        screen.queryAllByRole('button', { name: /Run Evaluation/i }).length,
      );
    });

    // Now change provider while evaluation is running (this might trigger the bug)
    const providerSelects = screen.queryAllByTestId('provider-select');
    console.log('Provider selects found:', providerSelects.length);

    if (providerSelects.length === 0) {
      console.log('No provider select found, checking by role...');
      const selectElements = screen.queryAllByRole('combobox');
      console.log('Combobox elements found:', selectElements.length);
      selectElements.forEach((select, index) => {
        console.log(
          `Combobox ${index} value:`,
          (select as HTMLSelectElement).value,
        );
      });
    }

    expect(providerSelects.length).toBeGreaterThan(0);
    const providerSelect = providerSelects[0];

    fireEvent.change(providerSelect, { target: { value: 'gemini' } });

    // Wait a bit for provider change to take effect
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check state after provider change
    console.log('=== AFTER PROVIDER CHANGE ===');
    const promptEditorsAfter = screen.queryAllByTestId('prompt-editor');
    const inputEditorsAfter = screen.queryAllByTestId('input-editor');
    const loadingButtonsAfter = screen.queryAllByRole('button', {
      name: /Loading/i,
    });
    const runButtonsAfter = screen.queryAllByRole('button', {
      name: /Run Evaluation/i,
    });

    console.log('Prompt editors after:', promptEditorsAfter.length);
    console.log('Input editors after:', inputEditorsAfter.length);
    console.log('Loading buttons after:', loadingButtonsAfter.length);
    console.log('Run buttons after:', runButtonsAfter.length);

    // We should still have exactly one ConfigurationPanel
    expect(promptEditorsAfter).toHaveLength(1);
    expect(inputEditorsAfter).toHaveLength(1);

    // Should have either loading or run buttons, but total should be 1
    expect(loadingButtonsAfter.length + runButtonsAfter.length).toBe(1);
  });
});
