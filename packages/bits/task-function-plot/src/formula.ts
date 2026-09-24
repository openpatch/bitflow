import { parseExpression, type ParseFailure } from "@bitflow/core";

/**
 * A thin wrapper around `@bitflow/core`'s hand-written arithmetic grammar, for
 * the one thing this bit needs from it: a function of `x`, evaluated at a
 * particular `x`. Nothing here adds any syntax of its own and nothing here
 * ever reaches `eval` or `Function` — `parseExpression` already refuses
 * anything but arithmetic, a short list of named functions and constants, and
 * (because `x` is given as a variable) implicit multiplication, so `3x` and
 * `2(x + 1)` read the way they are written on paper.
 */

/** `parseExpression`'s own failures, plus the one this wrapper adds: text left
 *  over after the arithmetic, which a plain quantity would read as a unit but
 *  a function definition has none to spare. */
export type FormulaError = ParseFailure | "trailing";

export type FormulaResult =
  | { ok: true; value: number }
  | { ok: false; error: FormulaError };

/** Reads `source` as a function of `x` and evaluates it at the given `x`. */
export const evaluateFormulaAt = (source: string, x: number): FormulaResult => {
  const parsed = parseExpression(source, { variables: { x } });
  if (!parsed.ok) return { ok: false, error: parsed.error };
  // A non-empty `rest` is text the grammar did not read at all — `2x +`, or a
  // stray character after otherwise valid arithmetic.
  if (parsed.rest !== "") return { ok: false, error: "trailing" };
  return { ok: true, value: parsed.value };
};

/**
 * `source` as a plain function, for sampling a curve to draw. Any failure —
 * a syntax error while the author is still typing, or a value that is not
 * finite at this particular `x` (a domain error, an asymptote) — becomes
 * `NaN`, which `sampleCurve` already reads as a break in the line rather than
 * a point to plot. Nothing here throws: a bit's `Task` is handed whatever a
 * document says, including a `target` written against a version of this bit
 * that validated it differently, and it has to render something sensible
 * regardless.
 */
export const formulaFn = (source: string): ((x: number) => number) => {
  return (x: number) => {
    const result = evaluateFormulaAt(source, x);
    return result.ok ? result.value : NaN;
  };
};

const FORMULA_ERROR_MESSAGES: Record<FormulaError, string> = {
  empty: "Enter a function of x, like “0.5x^2 - 2”.",
  tooLong: "That is too long to be a function of x.",
  syntax:
    "That is not arithmetic the task can work out. It accepts + − × ÷ ^, sqrt, sin, cos, exp, ln, abs, pi, e, and x.",
  unknownName:
    "That name is not one the task knows. It accepts sqrt, sin, cos, exp, ln, abs, pi, e, and x.",
  arity: "One of the functions there is called with the wrong number of arguments.",
  // Never actually produced — this bit always evaluates with `allowExpression`
  // on — but `FormulaError` is `ParseFailure | "trailing"` and this keeps the
  // mapping exhaustive rather than reaching for a default case that would stop
  // TypeScript catching a real one left out by mistake.
  expressionNotAllowed: "Enter a valid function of x.",
  notFinite:
    "That is not a finite number at every handle — check for something like dividing by zero or the square root of a negative number.",
  trailing: "There is text left over after the function — check for a stray character.",
};

/** A message an author can act on, for whichever way `evaluateFormulaAt` failed. */
export const describeFormulaError = (error: FormulaError): string =>
  FORMULA_ERROR_MESSAGES[error];
