import type { Line } from "./schema";

/**
 * Parsons lines as a block of code, and back.
 *
 * A Parsons problem *is* a program, and the way to write a program down is to
 * type it. Authoring it as one form per line meant a dozen panels to open for
 * a dozen lines, with the shape of the thing — which is the whole subject of
 * the exercise — never visible at all. Here the author pastes the program in
 * and the nesting they can see is the nesting that gets stored.
 */

/** What one step of nesting is written as, on the way back out to text. */
const STEP = "    ";

export const programLines = (lines: Line[]): Line[] =>
  lines.filter((line) => !line.distractor);

export const distractorLines = (lines: Line[]): Line[] =>
  lines.filter((line) => line.distractor);

export const asText = (lines: Line[]): string =>
  lines.map((line) => STEP.repeat(line.indent) + line.text).join("\n");

/**
 * How wide one step of nesting is in this particular block of text.
 *
 * Read off the text rather than fixed at four, because two-space code,
 * four-space code and tabbed code are all ordinary and all mean the same
 * thing. The narrowest indent that occurs is one step, so a program pasted in
 * whatever it happens to be written in keeps the nesting it looks like it has.
 */
export const indentUnit = (text: string): number => {
  const widths = text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.length - line.trimStart().length)
    .filter((width) => width > 0);
  return widths.length === 0 ? 1 : Math.min(...widths);
};

/**
 * Text to lines, keeping the id of any line whose code is unchanged.
 *
 * `spare` is drawn from every line in the task, not just the ones on this side
 * of the distractor split, so moving a line from the program to the lines that
 * do not belong keeps its identity — and an answer that named it stays valid.
 *
 * Blank lines are dropped: the schema asks every line for some code, and a
 * blank one in a Parsons bank is a card with nothing on it.
 */
export const asLines = (
  text: string,
  spare: Line[],
  distractor: boolean,
): Line[] => {
  const unit = indentUnit(text);
  const pool = [...spare];

  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const indent = Math.round(
        (line.length - line.trimStart().length) / unit,
      );
      const text = line.trim();
      const index = pool.findIndex((candidate) => candidate.text === text);
      const id =
        index !== -1
          ? pool.splice(index, 1)[0].id
          : `line-${Math.random().toString(36).slice(2, 9)}`;
      return { id, text, indent: distractor ? 0 : indent, distractor };
    });
};

/** Both boxes, as the single list the schema stores. */
export const linesFrom = (
  program: string,
  distractors: string,
  existing: Line[],
): Line[] => {
  const spare = [...existing];
  const solution = asLines(program, spare, false);
  // Taken out of the pool so the two boxes cannot both claim one id.
  for (const line of solution) {
    const index = spare.findIndex((candidate) => candidate.id === line.id);
    if (index !== -1) spare.splice(index, 1);
  }
  return [...solution, ...asLines(distractors, spare, true)];
};

/** Whether two lists say the same thing, ids aside. */
export const sameLines = (a: Line[], b: Line[]): boolean =>
  a.length === b.length &&
  a.every(
    (line, index) =>
      line.text === b[index].text &&
      line.indent === b[index].indent &&
      line.distractor === b[index].distractor,
  );
