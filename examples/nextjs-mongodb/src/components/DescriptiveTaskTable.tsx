import { round } from "@bitflow/stats";
import { Table, TableBody, TableCell, TableRow } from "@openpatch/patches";

export type DescriptiveTaskTableProps = {
  n?: number;
  mean?: number;
  difficulty?: number;
  discriminationIndex?: number;
  standardDeviation?: number;
};

export const DescriptiveTaskTable = ({
  n,
  mean,
  difficulty,
  discriminationIndex,
  standardDeviation,
}: DescriptiveTaskTableProps) => {
  return (
    <Table>
      <TableBody>
        <TableRow>
          <TableCell isHeader>n</TableCell>
          <TableCell align="right">{n}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell isHeader>Mean</TableCell>
          <TableCell align="right">{round(mean, 2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell isHeader>Difficulty</TableCell>
          <TableCell align="right">{round(difficulty, 2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell isHeader>Discrimination Index</TableCell>
          <TableCell align="right">{round(discriminationIndex, 2)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell isHeader>Standard Deviation</TableCell>
          <TableCell align="right">{round(standardDeviation, 2)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
