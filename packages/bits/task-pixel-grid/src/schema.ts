import { defaultEvaluation, EvaluationSchema } from "@bitflow/core";
import { z } from "zod";

/**
 * A pixel grid: the learner paints a small raster from a palette, cell by
 * cell, and it is marked against the picture the author had in mind.
 *
 * Modelled on the school book's pixel-graphics chapter — PBM's "P1" black and
 * white listing, PGM's greyscale, PPM's colour — which teaches that a picture
 * is nothing but numbers in a grid before it ever teaches a file format. The
 * ungraded editor in that book lets a learner draw anything; this bit is the
 * graded half, where what they draw has to match. The default palette is
 * white and black labelled "0" and "1" so a PBM listing in the instruction
 * reads exactly like the grid underneath it.
 */

export const PaletteEntrySchema = z.object({
  /** Stable across edits, so a target or a startColor keeps pointing at the
   * same colour even after the author renames it or moves it in the list. */
  id: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "A colour is a 6-digit hex code, e.g. #ffffff."),
  /** What this colour means, e.g. "0" for a PBM listing or "sky" for a scene.
   * Author-editable rather than derived, because the same hex can mean
   * different things in different pictures. */
  label: z.string().default(""),
});
export type PaletteEntry = z.infer<typeof PaletteEntrySchema>;

/** White and black, labelled the way a PBM listing spells them. */
export const DEFAULT_PALETTE: PaletteEntry[] = [
  { id: "white", color: "#ffffff", label: "0" },
  { id: "black", color: "#000000", label: "1" },
];

export const DataSchema = z
  .object({
    instruction: z.string().default(""),
    rows: z.number().int().min(1).max(32).default(5),
    columns: z.number().int().min(1).max(32).default(5),
    palette: z
      .array(PaletteEntrySchema)
      .min(1)
      .default(() => DEFAULT_PALETTE.map((entry) => ({ ...entry }))),
    /** The picture the learner must match, as palette ids, rows by columns. */
    target: z.array(z.array(z.string())).default([]),
    /**
     * Cells already filled in and locked, rows by columns. Empty means
     * nothing is locked — kept as "no array" rather than "an array of every
     * cell false" so an untouched task costs nothing to store.
     */
    given: z.array(z.array(z.boolean())).default([]),
    /** The palette id every free cell starts as, before the learner paints
     * anything. */
    startColor: z.string().default(() => DEFAULT_PALETTE[0]!.id),
    /** Row and column numbers along the edges. */
    showCoordinates: z.boolean().default(true),
    /** Each palette entry's label drawn inside its cells — useful for a PBM
     * grid of 0s and 1s, where the colour alone is easy to misread. */
    showLabels: z.boolean().default(false),
    partialCredit: z.boolean().default(true),
    evaluation: EvaluationSchema.default(defaultEvaluation),
  })
  .check((ctx) => {
    const { palette, rows, columns, target, given, startColor } = ctx.value;

    const ids = palette.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length) {
      ctx.issues.push({
        code: "custom",
        input: palette,
        path: ["palette"],
        message: "Each colour needs its own id.",
      });
    }

    if (ctx.value.evaluation.mode !== "auto") return;

    if (target.length !== rows || target.some((row) => row.length !== columns)) {
      ctx.issues.push({
        code: "custom",
        input: target,
        path: ["target"],
        message: `The picture is ${target.length} by ${target[0]?.length ?? 0} but the grid is ${rows} by ${columns}. Paint the picture again.`,
      });
      return;
    }

    if (target.some((row) => row.some((id) => !ids.includes(id)))) {
      ctx.issues.push({
        code: "custom",
        input: target,
        path: ["target"],
        message: "The picture uses a colour that is not in the palette.",
      });
    }

    if (given.length > 0 && (given.length !== rows || given.some((row) => row.length !== columns))) {
      ctx.issues.push({
        code: "custom",
        input: given,
        path: ["given"],
        message: `The locked cells are ${given.length} by ${given[0]?.length ?? 0} but the grid is ${rows} by ${columns}.`,
      });
    }

    if (!ids.includes(startColor)) {
      ctx.issues.push({
        code: "custom",
        input: startColor,
        path: ["startColor"],
        message: "Choose a starting colour from the palette.",
      });
    }
  });

export type Data = z.infer<typeof DataSchema>;

export const AnswerSchema = z.object({
  /** Palette ids, rows by columns. Not padded to size here — a stored answer
   * from a smaller grid the author has since resized is padded back out by
   * `effectiveCells` at read time instead of being rewritten. */
  cells: z.array(z.array(z.string())).default([]),
});
export type Answer = z.infer<typeof AnswerSchema>;

/** Whether a cell is pre-filled and locked. Out of range is never given: a
 * `given` array left over from a smaller grid must not lock cells outside it. */
export const isGiven = (data: Data, row: number, column: number): boolean =>
  data.given[row]?.[column] === true;

export const paletteEntry = (
  data: Data,
  id: string | undefined,
): PaletteEntry | undefined => data.palette.find((entry) => entry.id === id);

/**
 * The colours the learner sees, rows by columns: the target wherever a cell
 * is given, the stored answer (or `startColor`) everywhere else.
 *
 * Given cells are read from `target` rather than from the answer, so a
 * learner cannot end up looking at a locked cell that disagrees with the
 * picture just because an older answer recorded something else there.
 */
export const effectiveCells = (data: Data, answerCells?: string[][]): string[][] =>
  Array.from({ length: data.rows }, (_row, row) =>
    Array.from({ length: data.columns }, (_column, column) =>
      isGiven(data, row, column)
        ? (data.target[row]?.[column] ?? data.startColor)
        : (answerCells?.[row]?.[column] ?? data.startColor),
    ),
  );

/** A fresh grid with every cell at `startColor` — what "Clear" resets to. */
export const blankCells = (data: Data): string[][] =>
  Array.from({ length: data.rows }, () =>
    Array.from({ length: data.columns }, () => data.startColor),
  );

/** One cell repainted, leaving every other cell and row untouched. */
export const paintCell = (
  cells: string[][],
  row: number,
  column: number,
  colorId: string,
): string[][] => {
  const next = cells.map((line) => [...line]);
  next[row] = [...(next[row] ?? [])];
  next[row][column] = colorId;
  return next;
};

/**
 * A grid resized to `rows` by `columns`, keeping every cell that is still in
 * range and filling the rest with `fill`.
 *
 * Used when the author changes the size: repainting from scratch every time a
 * dimension changes would throw away a picture over one extra row.
 */
export const resizeGrid = <T,>(
  grid: T[][],
  rows: number,
  columns: number,
  fill: T,
): T[][] =>
  Array.from({ length: rows }, (_row, row) =>
    Array.from({ length: columns }, (_column, column) => grid[row]?.[column] ?? fill),
  );

/**
 * Black or white, whichever reads on top of `hex`.
 *
 * A quick luminance estimate, not a WCAG contrast calculation — it only has
 * to pick a legible ink for a palette label the author chose, not certify a
 * ratio.
 */
export const contrastColor = (hex: string): "#000000" | "#ffffff" => {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
};
