import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ParameterSlider from '../src/components/ParameterSlider.js';

describe('ParameterSlider Component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders with label and correct initial value', () => {
    render(
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={2}
        onChange={() => {}}
      />,
    );

    // Check that the label is rendered
    expect(screen.getByLabelText('Temperature')).toBeInTheDocument();

    // Check that the inputs have the correct initial value
    expect(screen.getByDisplayValue('0.7')).toBeInTheDocument();
  });

  it('synchronizes slider and input values', () => {
    const handleChange = vi.fn();

    render(
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={2}
        step={0.1}
        onChange={handleChange}
      />,
    );

    // Get the slider using its specific type
    const sliderElement = document.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;

    // Move the slider to 1.5
    fireEvent.change(sliderElement, { target: { value: '1.5' } });

    // Check that onChange was called with the new value
    expect(handleChange).toHaveBeenCalledWith(1.5);
  });

  it('handles direct input into the number field', () => {
    const handleChange = vi.fn();

    render(
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={2}
        onChange={handleChange}
      />,
    );

    const numberInput = document.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;

    // Change the input value directly
    fireEvent.change(numberInput, { target: { value: '1.2' } });

    // Check that onChange was called with the new value
    expect(handleChange).toHaveBeenCalledWith(1.2);
  });

  it('clamps values to min/max range', () => {
    const handleChange = vi.fn();

    render(
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={2}
        onChange={handleChange}
      />,
    );

    const numberInput = document.querySelector(
      'input[type="number"]',
    ) as HTMLInputElement;

    // Try to set a value above the maximum
    fireEvent.change(numberInput, { target: { value: '3' } });
    fireEvent.blur(numberInput);

    // The onChange should be called with the max value
    expect(handleChange).toHaveBeenCalledWith(2);

    // Try to set a value below the minimum
    fireEvent.change(numberInput, { target: { value: '-1' } });
    fireEvent.blur(numberInput);

    // The onChange should be called with the min value
    expect(handleChange).toHaveBeenCalledWith(0);
  });

  it('displays description text when provided', () => {
    render(
      <ParameterSlider
        label="Temperature"
        value={0.7}
        min={0}
        max={2}
        onChange={() => {}}
        description="Higher values make output more random, lower values make it more deterministic"
      />,
    );

    expect(
      screen.getByText(
        'Higher values make output more random, lower values make it more deterministic',
      ),
    ).toBeInTheDocument();
  });

  it('formats decimal places correctly', () => {
    render(
      <ParameterSlider
        label="Temperature"
        value={0.75}
        min={0}
        max={2}
        decimals={2}
        onChange={() => {}}
      />,
    );

    // The input should display the value with 2 decimal places
    expect(screen.getByDisplayValue('0.75')).toBeInTheDocument();
  });
});
