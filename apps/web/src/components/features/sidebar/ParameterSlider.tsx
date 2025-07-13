import React, { useState, useEffect, ChangeEvent, memo } from 'react';

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

  /**
   * Whether to use compact layout (for sidebars)
   */
  compact?: boolean;
}

/**
 * A specialized component that combines a slider with a synchronized number input
 * for configuring model parameters like temperature and top_p.
 */
const ParameterSlider = memo<ParameterSliderProps>(({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  decimals = 1,
  description,
  compact = false,
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
    <div className={compact ? 'space-y-2' : 'space-y-2'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label
            htmlFor={id}
            className={`block font-medium ${compact ? 'text-muted-foreground text-sm' : 'text-sm'}`}
          >
            {label}
          </label>
          {compact && description && (
            <button
              type="button"
              className="group relative"
              aria-label={`Help for ${label}`}
            >
              <svg
                className="text-muted-foreground hover:text-foreground h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="pointer-events-none absolute right-0 bottom-full z-50 mb-2 w-max max-w-[180px] rounded bg-gray-900 px-3 py-1.5 text-center text-xs break-words whitespace-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {description}
                <div className="absolute top-full right-2 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900" />
              </div>
            </button>
          )}
        </div>
        <input
          type="number"
          id={`${id}-number`}
          className={`border-border focus:border-primary focus:ring-primary bg-background min-w-0 rounded border text-right shadow-sm focus:ring-1 ${
            compact ? 'w-16 px-2 py-1 text-sm' : 'w-16 px-2 py-1 text-sm'
          }`}
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
        className={`w-full min-w-0 cursor-pointer appearance-none rounded-lg bg-gray-200 ${
          compact ? 'h-1.5' : 'h-2'
        }`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
      />

      <div
        className={`text-muted-foreground flex justify-between ${compact ? 'text-xs' : 'text-xs'}`}
      >
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {!compact && description && (
        <p className="text-muted mt-1 text-xs">{description}</p>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo optimization
  return (
    prevProps.label === nextProps.label &&
    prevProps.value === nextProps.value &&
    prevProps.min === nextProps.min &&
    prevProps.max === nextProps.max &&
    prevProps.step === nextProps.step &&
    prevProps.decimals === nextProps.decimals &&
    prevProps.description === nextProps.description &&
    prevProps.compact === nextProps.compact
  );
});

export default ParameterSlider;
