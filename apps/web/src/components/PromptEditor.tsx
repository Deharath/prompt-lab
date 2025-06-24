interface Props {
  value: string;
  onChange: (val: string) => void;
}

const PromptEditor = ({ value, onChange }: Props) => (
  <textarea
    data-testid="prompt-editor"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

export default PromptEditor;
