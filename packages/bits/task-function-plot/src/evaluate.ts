import type { BitResult } from "@bitflow/core";
import { formulaFn } from "./formula";
import type { Answer, Data } from "./schema";

export type HandleState = "correct" | "wrong";

/** Handle x (via `handleKey`) → whether the learner's value there is within
 *  tolerance of the target function. */
export type HandleStates = Record<string, HandleState>;

/**
 * The key an answer's `values` map uses for the handle at `x` — the x itself,
 * exactly as `data.handles` stores it, turned into a string. Handles are
 * validated distinct (`schema.ts`), so this never collides; keying by the x
 * rather than by its position in the array means an author reordering or
 * inserting a handle in the editor does not silently reattach an old answer
 * to a different position.
 */
export const handleKey = (x: number): string => String(x);

/** Room for the arithmetic itself, not for what counts as close enough — that
 *  is `data.tolerance`. Only guards against the kind of floating-point noise
 *  `0.1 + 0.2` produces. */
const EPSILON = 1e-9;

/**
 * Marking never re-derives the target from `shown` or anywhere else — only
 * `data.target`, evaluated at each handle, decides. A handle the learner never
 * touched has no entry in `answer.values` and is scored wrong outright, not
 * against whatever the knob happens to be drawn at while unset.
 */
export const handleStates = (data: Data, answer: Answer | undefined): HandleStates => {
  const target = formulaFn(data.target);
  const states: HandleStates = {};
  for (const x of data.handles) {
    const value = answer?.values?.[handleKey(x)];
    states[handleKey(x)] =
      value !== undefined &&
      Number.isFinite(value) &&
      Math.abs(value - target(x)) <= data.tolerance + EPSILON
        ? "correct"
        : "wrong";
  }
  return states;
};

/** A point per handle set within tolerance. */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const values = Object.values(handleStates(data, answer));
  return {
    earned: values.filter((state) => state === "correct").length,
    possible: values.length,
  };
};

/** Whether every handle is within tolerance of the target. */
export const allCorrect = (data: Data, answer: Answer | undefined): boolean => {
  const values = Object.values(handleStates(data, answer));
  return values.length > 0 && values.every((state) => state === "correct");
};

export const evaluate = ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): BitResult => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const right = allCorrect(data, answer);
  const points = scoreOf(data, answer);

  // All or nothing when the author says so, and when there is nothing to
  // count: a plot with no handles at all (impossible by construction, but a
  // document can say anything) would otherwise be scored out of zero.
  const score =
    data.partialCredit && points.possible > 0
      ? points
      : { earned: right ? 1 : 0, possible: 1 };

  return {
    state: right ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { handles: handleStates(data, answer) },
  };
};
