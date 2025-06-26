import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ModelSelector = ({ model, onChange }) => (_jsxs("select", { "data-testid": "model-select", value: model, onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "gpt-4.1-mini", children: "gpt-4.1-mini" }), _jsx("option", { value: "gemini-2.5-flash", children: "gemini-2.5-flash" })] }));
export default ModelSelector;
