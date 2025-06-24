interface Props {
  onRun: () => void;
  loading?: boolean;
}

const RunButton = ({ onRun, loading = false }: Props) => (
  <button type="button" onClick={onRun} disabled={loading}>
    {loading ? 'Running...' : 'Run'}
  </button>
);

export default RunButton;
