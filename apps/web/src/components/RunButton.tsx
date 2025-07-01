import Button from './ui/Button.js';

interface Props {
  onRun: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const RunButton = ({ onRun, loading = false, disabled = false }: Props) => {
  const getIcon = () => {
    if (disabled) {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    );
  };

  const getButtonText = () => {
    if (disabled) return 'Configure Template & Input';
    return 'Run Evaluation';
  };

  return (
    <Button
      onClick={onRun}
      loading={loading}
      disabled={disabled}
      variant="primary"
      size="lg"
      fullWidth
      icon={!loading ? getIcon() : undefined}
    >
      {getButtonText()}
    </Button>
  );
};

export default RunButton;
