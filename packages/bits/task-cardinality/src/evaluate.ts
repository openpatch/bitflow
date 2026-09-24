import type { BitResult } from "@bitflow/core";
import { endKey, type Answer, type Data, type End, type Notation } from "./schema";

/**
 * Two labels as the notation reads them. In Chen's notation "n" and "m" both
 * say "many" — the letters only keep the two ends of an n:m relationship
 * apart — so a learner who writes m where the author wrote n has said the same
 * thing.
 */
export const sameLabel = (notation: Notation, expected: string, given: string | undefined): boolean => {
  if (given === undefined) return false;
  if (notation === "chen") {
    const many = (label: string) => (label === "n" || label === "m" ? "many" : label);
    return many(expected) === many(given);
  }
  return expected === given;
};

export type EndStates = Record<string, "correct" | "wrong">;

export const endStates = (data: Data, answer: Answer | undefined): EndStates => {
  const states: EndStates = {};
  for (const relationship of data.relationships) {
    for (const end of ["from", "to"] as End[]) {
      const expected = end === "from" ? relationship.expectedFrom : relationship.expectedTo;
      const key = endKey(relationship.id, end);
      states[key] = sameLabel(data.notation, expected, answer?.ends?.[key]) ? "correct" : "wrong";
    }
  }
  return states;
};

export const evaluate = ({ data, answer }: { data: Data; answer?: Answer }): BitResult => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const states = endStates(data, answer);
  const values = Object.values(states);
  const correct = values.filter((state) => state === "correct").length;
  const allRight = values.length > 0 && correct === values.length;

  // All or nothing when the author says so, and when there is nothing to
  // count: a diagram with no relationships would otherwise score out of zero.
  const score =
    data.partialCredit && values.length > 0
      ? { earned: correct, possible: values.length }
      : { earned: allRight ? 1 : 0, possible: 1 };

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { ends: states },
  };
};
