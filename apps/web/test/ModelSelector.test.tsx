import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import ModelSelector from '../src/components/ModelSelector.js';

describe('ModelSelector', () => {
  it('renders with default values and triggers onChange', () => {
    const onProviderChange = vi.fn();
    const onModelChange = vi.fn();

    render(
      <ModelSelector
        provider="openai"
        model="gpt-4o-mini"
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
      />,
    );

    const providerSelect = screen.getByTestId(
      'provider-select',
    ) as HTMLSelectElement;
    const modelSelect = screen.getByTestId('model-select') as HTMLSelectElement;

    expect(providerSelect.value).toBe('openai');
    expect(modelSelect.value).toBe('gpt-4o-mini');

    // Test provider change
    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    expect(onProviderChange).toHaveBeenCalledWith('gemini');

    // Test model change
    fireEvent.change(modelSelect, { target: { value: 'gpt-4.1-mini' } });
    expect(onModelChange).toHaveBeenCalledWith('gpt-4.1-mini');
  });
});
