export type Table = {
  rows: string[];
  columns: string[];
  cells: (number | null)[][];
};

/**
 * Example: { "row1": { "c1": 2, "c3": 1}, { "row2": { "c1": 4, "c2": 1 }}}
 * => {
 *      "rows": ["row1", "row2"],
 *      "columns": ["c1", "c3", "c2"],
 *      "cells": [[2, 1, undefined], [4, undefined, 1]]
 * }
 */
export const convertMapToTable = (
  map: Record<string, Record<string, number>>
): Table => {
  const rowsSet: Set<string> = new Set();
  const columnsSet: Set<string> = new Set();
  Object.entries(map).forEach(([row, value]) => {
    rowsSet.add(row);
    Object.keys(value).forEach((column) => columnsSet.add(column));
  });

  const rows = Array.from(rowsSet);
  const columns = Array.from(columnsSet);

  const cells: (number | null)[][] = Array.from({ length: rows.length }, (_) =>
    new Array(columns.length).fill(null)
  );

  for (const [row, value] of Object.entries(map)) {
    let rowIndex = rows.indexOf(row);
    for (const [column, cell] of Object.entries(value)) {
      let columnIndex = columns.indexOf(column);
      cells[rowIndex][columnIndex] = cell;
    }
  }

  return {
    rows,
    columns,
    cells,
  };
};

export const inverseTable = (table: Table): Table => {
  const cells: (number | null)[][] = Array.from(
    { length: table.columns.length },
    (_) => new Array(table.cells.length).fill(null)
  );
  for (let x = 0; x < table.cells.length; x++) {
    for (let y = 0; y < table.cells[x].length; y++) {
      cells[y][x] = table.cells[x][y];
    }
  }

  return {
    rows: table.columns,
    columns: table.rows,
    cells,
  };
};

export const omitTableRows = (table: Table): Table & { cells: number[][] } => {
  const rows: string[] = [];
  const columns: string[] = table.columns;

  const cells = table.cells.filter((row, i) => {
    if (!row.includes(null)) {
      rows.push(table.rows[i]);
      return true;
    } else {
      return false;
    }
  }) as number[][];

  return {
    rows,
    columns,
    cells,
  };
};
