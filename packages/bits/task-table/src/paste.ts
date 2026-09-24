import type { Column, Row } from "./schema";

/**
 * Splits a pasted table into rows of cells.
 *
 * Copying a range out of a spreadsheet puts tab-separated text on the
 * clipboard; a `.csv` file is comma-separated. Both are supported from one
 * function, with the delimiter read off the first line rather than asked
 * for — a paste that came out wrong is easier to notice and fix than a
 * setting nobody knew to change. Quoting follows the CSV convention (RFC
 * 4180) for either delimiter, because a spreadsheet quotes a cell containing
 * the delimiter or a newline the same way whichever character separates its
 * columns.
 */
export const parseDelimited = (text: string): string[][] => {
  const normalised = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const firstLine = normalised.split("\n", 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalised.length; i++) {
    const char = normalised[i];

    if (inQuotes) {
      if (char === '"' && normalised[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  // A paste ending in a newline puts one empty row on the end; a table row of
  // nothing but empty cells is never what was meant.
  if (rows.length > 1 && rows[rows.length - 1].every((cell) => cell === "")) {
    rows.pop();
  }

  return rows;
};

/**
 * A pasted table, turned into columns and rows. The first line is read as
 * headers; anything after it is a row.
 *
 * Every cell comes out `given` or every cell comes out blank with the pasted
 * value as its answer, as the author chooses: a table of context the learner
 * reads, or — what a predicted query result is — the answer key itself, copied
 * straight out of the database it came from. Mixing the two is a click per
 * cell afterwards. Column and row ids are
 * freshly minted, since a paste carries no ids of its own to keep.
 *
 * Pure and side-effect free, so the "Paste table" control in the authoring
 * form can preview what it is about to do, and this is what the parser test
 * exercises directly.
 */
export const tableFromPaste = (
  text: string,
  as: "given" | "blank" = "given",
): { columns: Column[]; rows: Row[] } | undefined => {
  const grid = parseDelimited(text).filter((line) => line.some((cell) => cell.trim() !== ""));
  if (grid.length === 0) return undefined;

  const [header, ...body] = grid;

  const columns: Column[] = header.map((name, index) => ({
    id: `column-${index + 1}`,
    header: name.trim(),
    kind: "text",
  }));

  const rows: Row[] = body.map((cells, rowIndex) => ({
    id: `row-${rowIndex + 1}`,
    cells: Object.fromEntries(
      columns.map((column, columnIndex) => {
        const value = (cells[columnIndex] ?? "").trim();
        return [
          column.id,
          as === "given" ? { given: value } : { accepted: value === "" ? [] : [value] },
        ];
      }),
    ),
  }));

  return { columns, rows };
};
