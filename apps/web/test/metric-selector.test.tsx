import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MetricSelector, {
  MetricOption,
} from '../src/components/MetricSelector.js';

describe('MetricSelector Component', () => {
  const sampleMetrics: MetricOption[] = [
    {
      id: 'flesch_reading_ease',
      name: 'Flesch Reading Ease',
      description:
        'Calculates how easy the text is to read based on sentence length and word complexity.',
    },
    {
      id: 'word_count',
      name: 'Word Count',
      description: 'Counts the number of words in the response.',
    },
    {
      id: 'keywords',
      name: 'Keyword Presence',
      description: 'Checks if specific keywords are present in the response.',
      requiresInput: true,
      inputLabel: 'Keywords (comma-separated)',
      inputPlaceholder: 'e.g., climate, sustainability, renewable',
    },
  ];

  it('renders metrics with checkboxes', () => {
    render(
      <MetricSelector
        metrics={sampleMetrics}
        selectedMetrics={[]}
        onChange={() => {}}
      />,
    );

    // Check that all metrics are rendered
    expect(screen.getByText('Flesch Reading Ease')).toBeInTheDocument();
    expect(screen.getByText('Word Count')).toBeInTheDocument();
    expect(screen.getByText('Keyword Presence')).toBeInTheDocument();

    // Check that checkboxes exist
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);

    // Verify none are checked
    checkboxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  it('shows keyword input field only when checkbox is checked', () => {
    const onChange = vi.fn();

    render(
      <MetricSelector
        metrics={sampleMetrics}
        selectedMetrics={[]}
        onChange={onChange}
      />,
    );

    // Initially, the keyword input should not be visible
    expect(screen.queryByTestId('keyword-input')).not.toBeInTheDocument();

    // Check the "Keyword Presence" checkbox
    const keywordCheckbox = screen.getByLabelText('Keyword Presence');
    fireEvent.click(keywordCheckbox);

    // The keyword input should now be visible
    expect(screen.getByTestId('keyword-input')).toBeInTheDocument();

    // Expect the onChange to have been called with the selected metric
    expect(onChange).toHaveBeenCalledWith([{ id: 'keywords' }]);

    // Uncheck the checkbox
    fireEvent.click(keywordCheckbox);

    // The input should be hidden again
    expect(screen.queryByTestId('keyword-input')).not.toBeInTheDocument();

    // Expect onChange to have been called with an empty array
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('updates input value when typing in the keyword field', () => {
    const onChange = vi.fn();

    render(
      <MetricSelector
        metrics={sampleMetrics}
        selectedMetrics={[{ id: 'keywords' }]}
        onChange={onChange}
      />,
    );

    // The keyword input should be visible since 'keywords' is selected
    const keywordInput = screen.getByTestId('keyword-input');
    expect(keywordInput).toBeInTheDocument();

    // Type in the input field
    fireEvent.change(keywordInput, {
      target: { value: 'climate, sustainability' },
    });

    // Expect onChange to be called with updated input
    expect(onChange).toHaveBeenCalledWith([
      { id: 'keywords', input: 'climate, sustainability' },
    ]);
  });

  it('handles empty metrics array', () => {
    render(
      <MetricSelector metrics={[]} selectedMetrics={[]} onChange={() => {}} />,
    );

    expect(screen.getByText('No metrics available')).toBeInTheDocument();
  });
});
