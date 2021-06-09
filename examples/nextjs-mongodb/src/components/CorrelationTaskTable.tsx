import { round } from "@bitflow/stats";
import { Table, TableBody, TableCell, TableRow } from "@openpatch/patches";

export type CorrelationTaskTableProps = {
  sort?: "desc" | "asc";
  entries?: {
    label: string;
    pearson: number;
  }[];
  limit?: number;
  include?: "all" | "positive" | "negative";
};

export const CorrelationTaskTable = ({
  sort = "desc",
  entries = [],
  limit = 5,
  include = "all",
}: CorrelationTaskTableProps) => {
  return (
    <Table>
      <TableBody>
        {entries
          .sort((a, b) =>
            sort === "desc"
              ? a.pearson < b.pearson
                ? 1
                : -1
              : a.pearson > b.pearson
              ? 1
              : -1
          )
          .filter((a) => {
            if (include === "positive" && a.pearson > 0) {
              return true;
            } else if (include === "negative" && a.pearson < 0) {
              return true;
            } else if (include === "all") {
              return true;
            }
            return false;
          })
          .slice(0, limit)
          .map((e) => (
            <TableRow key={e.label}>
              <TableCell isHeader>{e.label}</TableCell>
              <TableCell align="right">{round(e.pearson)}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};
