interface Props {
  onRun: () => void;
}

const RunButton = ({ onRun }: Props) => (
  <button type="button" onClick={onRun}>
    Run
  </button>
);

export default RunButton;
