import { describe, it, vi, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App.js';

describe('App', () => {
  it('fetches and displays results', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ perItem: Array(3), aggregates: { avgCosSim: 0.7 } }),
    })) as unknown as typeof fetch;

    render(<App />);
    fireEvent.change(screen.getByTestId('prompt-editor'), {
      target: { value: 'hi {{input}}' },
    });
    fireEvent.click(screen.getByText('Run'));

    await waitFor(() => screen.getByTestId('perItemCount'));
    expect(screen.getByTestId('perItemCount').textContent).toBe('3');
    expect(screen.getByTestId('avgCosSim').textContent).toBe('0.7');
  });
});
