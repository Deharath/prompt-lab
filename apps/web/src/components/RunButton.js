import { jsx as _jsx } from "react/jsx-runtime";
const RunButton = ({ onRun, loading = false }) => (_jsx("button", { type: "button", onClick: onRun, disabled: loading, children: loading ? 'Running...' : 'Run' }));
export default RunButton;
