import Card from './ui/Card.js';
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
    <Card title="Run Configuration">
      <div className="space-y-6">
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
        />

        {/* Max Tokens Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="max-tokens-input"
              className="block text-sm font-medium"
            >
              Maximum Tokens
            </label>
            <input
              type="number"
              id="max-tokens-input"
              className="w-24 rounded-md border-gray-300 text-right text-sm shadow-sm focus:border-primary focus:ring-primary"
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
          <p className="text-xs text-muted mt-1">
            Maximum number of tokens to generate (0 = model default)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default RunConfiguration;
