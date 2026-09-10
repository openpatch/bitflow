import type { BitResult } from "./schema";

/**
 * A bit's result may carry its own `score`. When it does not, the bit is worth
 * one point, earned iff the state is `correct`. `unknown` contributes nothing
 * to either side: it was never graded, so it must not drag the ratio down.
 *
 * Its own module rather than living in `engine.ts` because conditions score a
 * scoped set of results, and `engine.ts` imports `condition.ts` — putting it
 * here is what keeps that from becoming a cycle.
 */
export const scoreOf = (
  result: BitResult,
): { earned: number; possible: number } => {
  if (result.score) return result.score;
  if (result.state === "unknown") return { earned: 0, possible: 0 };
  return { earned: result.state === "correct" ? 1 : 0, possible: 1 };
};

export const totalScore = (
  results: Iterable<BitResult>,
): { earned: number; possible: number } => {
  let earned = 0;
  let possible = 0;
  for (const result of results) {
    const score = scoreOf(result);
    earned += score.earned;
    possible += score.possible;
  }
  return { earned, possible };
};
