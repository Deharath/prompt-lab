import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ResultsTable = ({ perItemCount, avgCosSim }) => (_jsx("table", { children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { children: "Items" }), _jsx("td", { "data-testid": "perItemCount", children: perItemCount })] }), _jsxs("tr", { children: [_jsx("td", { children: "Avg CosSim" }), _jsx("td", { "data-testid": "avgCosSim", children: avgCosSim })] })] }) }));
export default ResultsTable;
