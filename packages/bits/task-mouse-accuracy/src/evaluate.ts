import type { BitResult } from "@bitflow/core";
import {
  distanceBetween,
  indexOfDifficulty,
  type Answer,
  type Data,
  type Target,
} from "./schema";

export type RoundOutcome = {
  targetId: string;
  hit: boolean;
  /** Whether the hit was inside the author's allowance. */
  inTime: boolean;
  ms: number;
  /** How far the pointer had to travel, and how wide the target was. */
  distance: number;
  width: number;
  /** Fitts's index of difficulty for the move. */
  difficulty: number;
};

/**
 * What each round came to, with the two numbers a lesson about pointing is
 * actually about beside them.
 *
 * The distance is measured from the previous target, since that is where the
 * pointer was; for the first round there is nowhere to measure from, so it is
 * taken from the middle of the area.
 */
export const outcomes = (data: Data, answer: Answer | undefined): RoundOutcome[] => {
  const byId = new Map(data.targets.map((target) => [target.id, target]));
  let from: { x: number; y: number } = { x: 0.5, y: 0.5 };

  return (answer?.rounds ?? []).map((round) => {
    const target: Target | undefined = byId.get(round.targetId);
    const distance = target
      ? distanceBetween(from, target, data.aspectRatio)
      : 0;
    const width = target ? target.radius * 2 : 0;
    if (target) from = { x: target.x, y: target.y };

    return {
      targetId: round.targetId,
      hit: round.hit,
      inTime: round.hit && round.ms <= data.allowanceMs,
      ms: round.ms,
      distance,
      width,
      difficulty: indexOfDifficulty(distance, width),
    };
  });
};

/** Hits, misses, and the average time over the hits. */
export const summary = (marks: RoundOutcome[]) => {
  const hits = marks.filter((mark) => mark.hit);
  return {
    hits: hits.length,
    misses: marks.length - hits.length,
    /** Milliseconds, over the hits only: a miss says nothing about how fast someone is. */
    meanMs:
      hits.length === 0
        ? 0
        : Math.round(hits.reduce((total, mark) => total + mark.ms, 0) / hits.length),
  };
};

/**
 * A point per target hit, and — when the author asks for speed as well — a
 * second for each hit made inside the allowance.
 *
 * Kept apart so partial credit means something: someone who hit every target
 * but took their time has done the accurate half of the task, and one number
 * for both would say otherwise.
 */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const marks = outcomes(data, answer);
  const perTarget = data.scoring === "hitsAndSpeed" ? 2 : 1;
  const earned =
    marks.filter((mark) => mark.hit).length +
    (data.scoring === "hitsAndSpeed" ? marks.filter((mark) => mark.inTime).length : 0);

  return { earned, possible: data.targets.length * perTarget };
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

  /*
   * Standing down is not a wrong answer, and it is not a zero either. An
   * `unknown` result is worth nothing out of nothing, so it neither rewards
   * the learner nor drags their total down — which is the only honest way to
   * count a task somebody could not attempt.
   */
  if (answer?.optedOut) {
    return {
      state: "unknown",
      score: { earned: 0, possible: 0 },
      allowRetry: false,
      detail: { optedOut: true },
    };
  }

  const marks = outcomes(data, answer);
  const score = scoreOf(data, answer);
  const allRight = score.possible > 0 && score.earned === score.possible;

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // Per round, so the task can show where each click landed, and so a
      // lesson can plot time against difficulty.
      rounds: marks,
      ...summary(marks),
    },
  };
};
