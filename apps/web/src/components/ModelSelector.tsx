interface Props {
  model: string;
  onChange: (model: string) => void;
}

const ModelSelector = ({ model, onChange }: Props) => (
  <select
    data-testid="model-select"
    value={model}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="gpt-4.1-mini">gpt-4.1-mini</option>
    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
  </select>
);

export default ModelSelector;
