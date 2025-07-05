import ParameterSlider from './ParameterSlider.js';

interface RunConfigurationProps {
  temperature: number;
  topP: number;
  maxTokens: number;
  onTemperatureChange: (value: number) => void;
  onTopPChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
}

/**
 * Component for configuring advanced LLM parameters like temperature, top_p, and max tokens
 */
const RunConfiguration = ({
  temperature,
  topP,
  maxTokens,
  onTemperatureChange,
  onTopPChange,
  onMaxTokensChange,
}: RunConfigurationProps) => {
  return (
    <div className="space-y-3">
      {/* Temperature Slider */}
      <ParameterSlider
        label="Temperature"
        value={temperature}
        onChange={onTemperatureChange}
        min={0}
        max={2.0}
        step={0.01}
        decimals={2}
        description="Higher values make output more random, lower values make it more deterministic"
        compact
      />

      {/* Top P Slider */}
      <ParameterSlider
        label="Top P"
        value={topP}
        onChange={onTopPChange}
        min={0}
        max={1.0}
        step={0.01}
        decimals={2}
        description="Controls diversity by limiting the cumulative probability of token selection"
        compact
      />

      {/* Max Tokens Input */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="max-tokens-input"
            className="text-muted-foreground block text-xs font-medium"
          >
            Maximum Tokens
          </label>
          <input
            type="number"
            id="max-tokens-input"
            className="border-border focus:border-primary focus:ring-primary bg-background w-20 rounded border px-2 py-1 text-right text-xs shadow-sm focus:ring-1"
            value={maxTokens}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 0) {
                onMaxTokensChange(value);
              }
            }}
            min={0}
            max={32768}
            step={1}
          />
        </div>
      </div>
    </div>
  );
};

export default RunConfiguration;
