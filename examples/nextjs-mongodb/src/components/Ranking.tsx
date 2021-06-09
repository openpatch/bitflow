import { Table, TableBody, TableCell, TableRow } from "@openpatch/patches";
import { ReactNode } from "react";

export type RankingProps<T> = {
  entries: {
    label: string;
    value: T;
  }[];
  limit: number;
  formatFn: (a: T) => ReactNode;
  compareFn: (a: T, b: T) => number;
  sort: "desc" | "asc";
};

export const Ranking = <T,>({
  entries = [],
  limit = 5,
  sort = "desc",
  compareFn,
  formatFn,
}: RankingProps<T>) => {
  const tableEntries = entries
    .sort(({ value: a }, { value: b }) =>
      sort === "desc" ? compareFn(a, b) * -1 : compareFn(a, b)
    )
    .slice(0, limit);
  return (
    <Table>
      <TableBody>
        {tableEntries.map((entry) => (
          <TableRow key={entry.label}>
            <TableCell isHeader>{entry.label}</TableCell>
            <TableCell align="right">{formatFn(entry.value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
