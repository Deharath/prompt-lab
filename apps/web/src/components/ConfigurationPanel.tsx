import PromptEditor from './PromptEditor.js';
import InputEditor from './InputEditor.js';
import RunButton from './RunButton.js';
import ModelSelector from './ModelSelector.js';
import Card from './ui/Card.js';

interface ConfigurationPanelProps {
  template: string;
  inputData: string;
  provider: string;
  model: string;
  running: boolean;
  onTemplateChange: (template: string) => void;
  onInputDataChange: (inputData: string) => void;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onRun: () => void;
}

const ConfigurationPanel = ({
  template,
  inputData,
  provider,
  model,
  running,
  onTemplateChange,
  onInputDataChange,
  onProviderChange,
  onModelChange,
  onRun,
}: ConfigurationPanelProps) => {
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6">
      {/* Prompt Card */}
      <Card gradient="blue">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
              Prompt
            </h2>
          </div>

          {/* Prompt Content */}
          <div className="space-y-6">
            <PromptEditor value={template} onChange={onTemplateChange} />
            <InputEditor value={inputData} onChange={onInputDataChange} />
          </div>
        </div>
      </Card>

      {/* Run Configuration Card */}
      <Card gradient="green">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold transition-colors duration-300 text-gray-900 dark:text-gray-100">
                Run Configuration
              </h2>
            </div>
          </div>

          {/* Configuration Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2">
              <ModelSelector
                provider={provider}
                model={model}
                onProviderChange={onProviderChange}
                onModelChange={onModelChange}
              />
            </div>

            {/* Primary Action - Bottom Right */}
            <div className="lg:justify-self-end">
              <RunButton
                onRun={onRun}
                loading={running}
                disabled={
                  !template.trim() ||
                  (!inputData.trim() && template.includes('{{input}}'))
                }
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfigurationPanel;
