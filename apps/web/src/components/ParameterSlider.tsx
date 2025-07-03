import { useState, useEffect, ChangeEvent } from 'react';

interface ParameterSliderProps {
  /**
   * Label displayed above the slider
   */
  label: string;

  /**
   * Current value of the slider/input
   */
  value: number;

  /**
   * Callback function when the value changes
   */
  onChange: (value: number) => void;

  /**
   * Minimum value for the slider and input
   */
  min: number;

  /**
   * Maximum value for the slider and input
   */
  max: number;

  /**
   * Step size for the slider
   */
  step?: number;

  /**
   * Number of decimal places to display
   */
  decimals?: number;

  /**
   * Optional description of the parameter shown as tooltip or helper text
   */
  description?: string;
}

/**
 * A specialized component that combines a slider with a synchronized number input
 * for configuring model parameters like temperature and top_p.
 */
const ParameterSlider = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  decimals = 1,
  description,
}: ParameterSliderProps) => {
  // Use local state to handle intermediate values during typing
  const [inputValue, setInputValue] = useState<string>(
    (value ?? 0).toFixed(decimals),
  );

  // Keep input value in sync with incoming prop changes
  useEffect(() => {
    setInputValue((value ?? 0).toFixed(decimals));
  }, [value, decimals]);

  // Handle slider changes
  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  // Handle text input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Allow typing and incomplete numbers
    setInputValue(e.target.value);

    // Only update actual value if it's a valid number
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      // Clamp value to min/max range
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    }
  };

  // Handle input blur to clean up any invalid state
  const handleInputBlur = () => {
    const parsedValue = parseFloat(inputValue);

    // If the input isn't a valid number, reset to current value
    if (isNaN(parsedValue)) {
      setInputValue(value.toFixed(decimals));
      return;
    }

    // Clamp the value to min/max and format properly
    const clampedValue = Math.min(Math.max(parsedValue, min), max);
    setInputValue(clampedValue.toFixed(decimals));
    onChange(clampedValue);
  };

  const id = `parameter-slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <input
          type="number"
          id={`${id}-number`}
          className="w-16 rounded-md border-gray-300 text-right text-sm shadow-sm focus:border-primary focus:ring-primary"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
        />
      </div>

      <input
        type="range"
        id={id}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
      />

      <div className="flex justify-between text-xs text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {description && <p className="text-xs text-muted mt-1">{description}</p>}
    </div>
  );
};

export default ParameterSlider;
