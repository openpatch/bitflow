import type { BitResult } from "@bitflow/core";
import type { Answer, Data, Match } from "./schema";

/**
 * A match is right when both cards came from the same pair.
 *
 * One point each, as in H5P: a learner who matched four of six has understood
 * four of six, and all-or-nothing would say otherwise. A left card left
 * unmatched simply earns nothing — there is no penalty, because leaving one
 * alone is not a claim about it.
 */
export const isRight = (match: Match): boolean => match.leftId === match.rightId;

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

  const matches = answer?.matches ?? [];
  const right = matches.filter(isRight);
  const possible = data.pairs.length;
  const allRight = possible > 0 && right.length === possible;

  return {
    state: allRight ? "correct" : "wrong",
    score: { earned: right.length, possible },
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Which pairings held, so each can be marked where it sits rather than
      // the learner being given a number to reverse-engineer.
      matches: matches.map((match) => ({ ...match, correct: isRight(match) })),
    },
  };
};
