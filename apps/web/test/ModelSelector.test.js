import { jsx as _jsx } from "react/jsx-runtime";
// eslint-disable-next-line object-curly-newline
import { describe, it, expect, vi } from 'vitest';
// eslint-disable-next-line object-curly-newline
import { render, fireEvent, screen } from '@testing-library/react';
// eslint-disable-next-line import/extensions
import ModelSelector from '../src/components/ModelSelector.js';
describe('ModelSelector', () => {
    it('renders with default value and triggers onChange', () => {
        const onChange = vi.fn();
        render(_jsx(ModelSelector, { model: "gpt-4.1-mini", onChange: onChange }));
        const select = screen.getByTestId('model-select');
        expect(select.value).toBe('gpt-4.1-mini');
        fireEvent.change(select, { target: { value: 'gemini-2.5-flash' } });
        expect(onChange).toHaveBeenCalledWith('gemini-2.5-flash');
    });
});
