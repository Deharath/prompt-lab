import PromptEditor from './PromptEditor.js';
import RunButton from './RunButton.js';
import ModelSelector from './ModelSelector.js';

interface ConfigurationPanelProps {
  template: string;
  provider: string;
  model: string;
  running: boolean;
  onTemplateChange: (template: string) => void;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
  onRun: () => void;
}

const ConfigurationPanel = ({
  template,
  provider,
  model,
  running,
  onTemplateChange,
  onProviderChange,
  onModelChange,
  onRun,
}: ConfigurationPanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <PromptEditor value={template} onChange={onTemplateChange} />
        </div>
        <ModelSelector
          provider={provider}
          model={model}
          onProviderChange={onProviderChange}
          onModelChange={onModelChange}
        />
        <div className="flex items-end">
          <RunButton onRun={onRun} loading={running} />
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
