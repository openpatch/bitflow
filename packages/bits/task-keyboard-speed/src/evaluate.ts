import type { BitResult } from "@bitflow/core";
import {
  accuracyOf,
  correctCharacters,
  wordsPerMinute,
  type Answer,
  type Data,
} from "./schema";

export type Measurement = {
  /** Characters in the right place. */
  correct: number;
  /** Of the longer of the two texts, as a fraction. */
  accuracy: number;
  /** Net words per minute; `0` when the attempt was not timed. */
  wpm: number;
  elapsedMs: number;
  /** Whether accuracy reached what the author asked for. */
  accurateEnough: boolean;
  /** Whether the typing reached the author's target speed. */
  fastEnough: boolean;
};

export const measure = (data: Data, answer: Answer | undefined): Measurement => {
  const typed = answer?.typed ?? "";
  const elapsedMs = data.timed ? (answer?.elapsedMs ?? 0) : 0;
  const accuracy = accuracyOf(data.text, typed);
  const wpm = data.timed ? wordsPerMinute(data.text, typed, elapsedMs) : 0;

  return {
    correct: correctCharacters(data.text, typed),
    accuracy,
    wpm,
    elapsedMs,
    accurateEnough: typed.length > 0 && accuracy >= data.requiredAccuracy,
    fastEnough: data.timed && wpm >= data.targetWpm,
  };
};

/**
 * A mark for typing it accurately, and — when the author asks for speed as
 * well — a second for typing it quickly enough.
 *
 * Kept apart, and accuracy first, because they are not the same skill and
 * because accuracy is the half everybody can be asked for. Speed is only ever
 * the second mark, never the only one: a task that scored words per minute
 * alone would fail a careful typist and pass a fast, wrong one.
 */
export const scoreOf = (
  data: Data,
  answer: Answer | undefined,
): { earned: number; possible: number } => {
  const marks = measure(data, answer);
  const possible = data.scoring === "accuracyAndSpeed" ? 2 : 1;
  const earned =
    (marks.accurateEnough ? 1 : 0) +
    (data.scoring === "accuracyAndSpeed" && marks.fastEnough ? 1 : 0);

  return { earned, possible };
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
   * Standing down is not a wrong answer and not a zero: an `unknown` result is
   * worth nothing out of nothing, so it neither rewards the learner nor drags
   * their total down. Typing speed is not a fair measure of everybody, and a
   * task that insisted would be measuring the wrong thing.
   */
  if (answer?.optedOut) {
    return {
      state: "unknown",
      score: { earned: 0, possible: 0 },
      allowRetry: false,
      detail: { optedOut: true },
    };
  }

  const marks = measure(data, answer);
  const score = scoreOf(data, answer);

  return {
    state: score.earned === score.possible ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: {
      ...marks,
      // Rounded for reading; the raw accuracy stays above it for anything
      // that wants to do arithmetic.
      accuracyPercent: Math.round(marks.accuracy * 100),
      wpmRounded: Math.round(marks.wpm),
    },
  };
};
