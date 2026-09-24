import type { BitResult } from "@bitflow/core";
import { toleranceFor, type Answer, type Data } from "./schema";

export type ItemState = "correct" | "wrong";

/** Item id → whether the learner's placement lands within tolerance. */
export type ItemStates = Record<string, ItemState>;

/** A hair past the tolerance itself, so a placement snapped to exactly the
 *  boundary is not thrown out by the same floating-point noise `snapValue`
 *  already rounds away. */
const EPSILON = 1e-9;

/**
 * An item with no position at all is wrong, on the same terms as one placed
 * too far off — there is no third "not attempted" state here, the same
 * reasoning as task-drag-drop's adrift elements not existing for scoring.
 */
export const itemStates = (data: Data, answer: Answer | undefined): ItemStates => {
  const states: ItemStates = {};
  for (const item of data.items) {
    const position = answer?.positions?.[item.id];
    states[item.id] =
      position !== undefined &&
      Math.abs(position - item.value) <= toleranceFor(data, item) + EPSILON
        ? "correct"
        : "wrong";
  }
  return states;
};

/** A point per item placed within its tolerance. */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const values = Object.values(itemStates(data, answer));
  return {
    earned: values.filter((state) => state === "correct").length,
    possible: values.length,
  };
};

/** Whether every item was placed within its tolerance. */
export const allCorrect = (data: Data, answer: Answer | undefined): boolean => {
  const values = Object.values(itemStates(data, answer));
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
  // count: a line with no items would otherwise be scored out of zero.
  const score =
    data.partialCredit && points.possible > 0
      ? points
      : { earned: right ? 1 : 0, possible: 1 };

  return {
    state: right ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { items: itemStates(data, answer) },
  };
};
