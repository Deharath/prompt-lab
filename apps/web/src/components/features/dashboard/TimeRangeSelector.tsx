import Button from '../../ui/Button.js';

interface TimeRangeSelectorProps {
  selectedDays: number;
  onDaysChange: (days: number) => void;
  isLoading?: boolean;
}

const TIME_RANGES = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

const TimeRangeSelector = ({
  selectedDays,
  onDaysChange,
  isLoading = false,
}: TimeRangeSelectorProps) => {
  return (
    <div
      role="group"
      aria-label="Select time range for data"
      className="flex space-x-2"
    >
      {TIME_RANGES.map((range) => (
        <Button
          key={range.value}
          variant={selectedDays === range.value ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onDaysChange(range.value)}
          disabled={isLoading}
          aria-pressed={selectedDays === range.value}
          aria-label={`Show data from last ${range.label.toLowerCase()}`}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
};

export default TimeRangeSelector;
