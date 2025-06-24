interface Props {
  perItemCount: number;
  avgCosSim: number;
}

const ResultsTable = ({ perItemCount, avgCosSim }: Props) => (
  <table>
    <tbody>
      <tr>
        <td>Items</td>
        <td data-testid="perItemCount">{perItemCount}</td>
      </tr>
      <tr>
        <td>Avg CosSim</td>
        <td data-testid="avgCosSim">{avgCosSim}</td>
      </tr>
    </tbody>
  </table>
);

export default ResultsTable;
