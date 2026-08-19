import type { BitResult } from "@bitflow/core";
import { read, sameValue, write, type ReadFailure } from "./numbers";
import {
  answerOptions,
  expectedValues,
  type Answer,
  type Data,
} from "./schema";

/** Why an answer is not right. `wrongValue` is a value; the rest are not one. */
export type Reason = ReadFailure | "wrongValue" | "correct";

export type Outcome = {
  correct: boolean;
  reason: Reason;
  /** Digits in the right place, where the author is marking them that way. */
  rightDigits?: number;
  totalDigits?: number;
};

/**
 * Marks the answer arithmetically rather than textually.
 *
 * `2A`, `2a` and `0x2A` are one answer; `00101010` and `101010` are one answer
 * unless the author asked for the width to be written out, and then the second
 * is refused for the reason it is wrong rather than for failing to match a
 * string. Everything here is a comparison of values, which is why no list of
 * accepted spellings is kept anywhere.
 */
export const judge = (data: Data, answer: Answer | undefined): Outcome => {
  const expected = expectedValues(data);
  if (expected === undefined) return { correct: false, reason: "empty" };

  const options = answerOptions(data);
  const reading = read(answer?.raw ?? "", data.targetRepresentation, options);

  // Digit by digit, against the answer written out in full. Only offered where
  // the width is fixed and written out, so the two strings line up position for
  // position and "the third bit is wrong" means something.
  const digits = data.scoring === "digits";
  const wanted = write(expected, data.targetRepresentation, options).toLowerCase();

  if (!reading.ok) {
    // Still counted out of the digits there were: what an item is worth must
    // not depend on how badly it was answered.
    return digits
      ? { correct: false, reason: reading.reason, rightDigits: 0, totalDigits: wanted.length }
      : { correct: false, reason: reading.reason };
  }

  const correct = sameValue(reading.values, expected);
  if (!digits) return { correct, reason: correct ? "correct" : "wrongValue" };

  const given = write(reading.values, data.targetRepresentation, options).toLowerCase();
  let right = 0;
  for (let index = 0; index < wanted.length; index++) {
    if (given[index] === wanted[index]) right += 1;
  }

  return {
    correct,
    reason: correct ? "correct" : "wrongValue",
    rightDigits: right,
    totalDigits: wanted.length,
  };
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

  const outcome = judge(data, answer);

  const score =
    data.scoring === "digits" && outcome.totalDigits
      ? { earned: outcome.rightDigits ?? 0, possible: outcome.totalDigits }
      : { earned: outcome.correct ? 1 : 0, possible: 1 };

  return {
    state: outcome.correct ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { reason: outcome.reason },
  };
};
