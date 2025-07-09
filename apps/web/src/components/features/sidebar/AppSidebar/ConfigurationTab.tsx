import React from 'react';
import ModelSelector from '../ModelSelector.js';
import RunConfiguration from '../RunConfiguration.js';
import MetricSelector from '../../../features/metrics/MetricSelector.js';
import { AVAILABLE_METRICS } from '../../../../constants/metrics.js';

interface ConfigurationTabProps {
  provider: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  selectedMetrics: any[];
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  setTemperature: (temp: number) => void;
  setTopP: (topP: number) => void;
  setMaxTokens: (tokens: number) => void;
  setSelectedMetrics: (metrics: any[]) => void;
}

/**
 * ConfigurationTab - Tab component for model and evaluation configuration
 *
 * This component handles the configuration tab of the unified AppSidebar, providing:
 * - Model selection (provider and specific model)
 * - Run configuration (temperature, top-p, max tokens)
 *
 * All settings are persisted in the job store and used for new evaluations.
 */
const ConfigurationTab: React.FC<ConfigurationTabProps> = ({
  provider,
  model,
  temperature,
  topP,
  maxTokens,
  selectedMetrics,
  onProviderChange,
  onModelChange,
  setTemperature,
  setTopP,
  setMaxTokens,
  setSelectedMetrics,
}) => {
  return (
    <div
      className="h-full max-w-full min-w-0 space-y-6 p-4"
      role="tabpanel"
      id="configuration-panel"
      aria-labelledby="configuration-tab"
    >
      <div className="min-w-0 space-y-6">
        {/* Model Selection Section */}
        <div className="min-w-0">
          <h3 className="text-foreground mb-3 text-sm font-medium">
            Model Configuration
          </h3>
          <ModelSelector
            provider={provider}
            model={model}
            onProviderChange={onProviderChange}
            onModelChange={onModelChange}
            compact
          />
        </div>

        {/* Run Configuration Section */}
        <div className="min-w-0">
          <h3 className="text-foreground mb-3 text-sm font-medium">
            Generation Parameters
          </h3>
          <RunConfiguration
            temperature={temperature}
            topP={topP}
            maxTokens={maxTokens}
            onTemperatureChange={setTemperature}
            onTopPChange={setTopP}
            onMaxTokensChange={setMaxTokens}
          />
        </div>

        {/* Metrics Selection Section */}
        <div className="min-w-0">
          <h3 className="text-foreground mb-3 text-sm font-medium">
            Evaluation Metrics
          </h3>
          <MetricSelector
            metrics={AVAILABLE_METRICS}
            selectedMetrics={selectedMetrics}
            onChange={setSelectedMetrics}
            compact
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigurationTab;
