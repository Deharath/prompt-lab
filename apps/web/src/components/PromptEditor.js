import { jsx as _jsx } from "react/jsx-runtime";
const PromptEditor = ({ value, onChange }) => (_jsx("textarea", { "data-testid": "prompt-editor", value: value, onChange: (e) => onChange(e.target.value) }));
export default PromptEditor;
