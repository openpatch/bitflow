import type { CompareMode } from "./schema";

/**
 * Deciding whether two pieces of maths are the same piece of maths.
 *
 * The work is done by Cortex's Compute Engine, which parses LaTeX into
 * MathJSON and reasons over that. It is a library doing algebra, not a
 * sandbox running the learner's input: `ce.parse` builds a data structure and
 * `isSame`/`isEqual` walk it. Nothing is executed, nothing is fetched, and the
 * whole decision is made in the browser from the two strings.
 *
 * It is loaded on demand. The engine is over a megabyte and most of a flow
 * never reaches a maths question, so paying for it at import time would tax
 * every other task in the assessment with it.
 */

/** The slice of Compute Engine used here, named so the rest can be mocked. */
type BoxedExpression = {
  isSame: (other: BoxedExpression) => boolean;
  isEqual: (other: BoxedExpression) => boolean | undefined;
  N: () => { re?: number };
  isValid: boolean;
};

type Engine = { parse: (latex: string) => BoxedExpression };

let pending: Promise<Engine> | undefined;

/**
 * The one engine, built once and kept.
 *
 * Constructing it parses a dictionary of several hundred definitions, so a new
 * one per comparison would make marking a ten-blank question ten times slower
 * than it needs to be.
 */
export const computeEngine = async (): Promise<Engine> => {
  pending ??= import("@cortex-js/compute-engine").then(
    (module) => new module.ComputeEngine() as unknown as Engine,
  );
  return pending;
};

/** Test seam: forget the loaded engine so a mock can take its place. */
export const resetComputeEngine = (): void => {
  pending = undefined;
};

/**
 * Floating-point slack for a value comparison with no tolerance set.
 *
 * Relative, so it holds for an answer in nanometres and one in light years.
 * This is not the author's tolerance — it only stops binary representation
 * deciding a mark.
 */
const nearlyEqual = (a: number, b: number): boolean => {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= 1e-9 * Math.max(1, scale);
};

export type ComparisonOptions = {
  mode: CompareMode;
  /** Only consulted in `value` mode. */
  tolerance?: number;
};

/**
 * Whether the learner's LaTeX answers to the author's, under one mode.
 *
 * An expression that will not parse is not the same as anything — including
 * another expression that will not parse, which is why `isValid` is checked
 * before the comparison rather than letting two errors agree with each other.
 */
export const sameMath = async (
  given: string,
  expected: string,
  options: ComparisonOptions,
): Promise<boolean> => {
  if (given.trim() === "" || expected.trim() === "") return false;

  const engine = await computeEngine();
  let a: BoxedExpression;
  let b: BoxedExpression;
  try {
    a = engine.parse(given);
    b = engine.parse(expected);
  } catch {
    // A parse that throws rather than returning an invalid expression is a
    // wrong answer, not a broken assessment.
    return false;
  }

  if (!a.isValid || !b.isValid) return false;

  try {
    switch (options.mode) {
      case "equivalent":
        // `isEqual` returns undefined where it cannot decide. Undecided is not
        // proven equal, and marking it right would be marking on a shrug.
        return a.isEqual(b) === true;

      case "value": {
        const given = a.N().re;
        const wanted = b.N().re;
        if (
          typeof given !== "number" ||
          typeof wanted !== "number" ||
          !Number.isFinite(given) ||
          !Number.isFinite(wanted)
        ) {
          // Anything with an unknown left in it has no value to compare.
          return false;
        }
        const tolerance = options.tolerance ?? 0;
        return tolerance > 0
          ? Math.abs(given - wanted) <= tolerance + Number.EPSILON
          : nearlyEqual(given, wanted);
      }

      case "symbolic":
      default:
        return a.isSame(b);
    }
  } catch {
    return false;
  }
};

/** Whether the learner's answer matches any of the ones the author accepts. */
export const matchesAny = async (
  given: string,
  accepted: readonly string[],
  options: ComparisonOptions,
): Promise<boolean> => {
  for (const expected of accepted) {
    if (await sameMath(given, expected, options)) return true;
  }
  return false;
};
