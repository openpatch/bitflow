import type { BitResult } from "@bitflow/core";
import { carriedStack, type Answer, type Data, type Frame } from "./schema";

/**
 * A call or a list of locals as it is compared: without any spaces, since
 * `fak( 3 )` and `fak(3)` are the same call, and `n=3` the same local as
 * `n = 3`; and case-folded unless the author says case matters.
 */
export const normalise = (value: string, caseSensitive: boolean): string => {
  const stripped = value.replace(/\s+/g, "");
  return caseSensitive ? stripped : stripped.toLowerCase();
};

export const frameCorrect = (
  expected: Frame,
  given: Frame | undefined,
  data: Pick<Data, "caseSensitive" | "showLocals">,
): boolean =>
  given !== undefined &&
  normalise(expected.call, data.caseSensitive) === normalise(given.call, data.caseSensitive) &&
  (!data.showLocals ||
    normalise(expected.locals, data.caseSensitive) === normalise(given.locals, data.caseSensitive));

export type StackState = {
  state: "correct" | "wrong";
  /** Per frame the learner wrote, top first: whether it is the frame that
   *  belongs at that height. */
  frames: boolean[];
};

/**
 * Every moment, judged. Frames are compared from the *bottom* up, where a
 * stack's history is: a missing call at the top leaves every frame beneath it
 * right, as it is, and does not shift the whole stack into being wrong.
 */
export const stackStates = (data: Data, answer: Answer | undefined): StackState[] =>
  data.checkpoints.map((checkpoint, index) => {
    const given = carriedStack(data, answer, index);
    const wanted = checkpoint.expected;
    const frames = given.map((frame, top) => {
      const fromBottom = given.length - 1 - top;
      return frameCorrect(wanted[wanted.length - 1 - fromBottom] ?? { call: "\u0000", locals: "" }, frame, data);
    });
    const right = given.length === wanted.length && frames.every(Boolean);
    return { state: right ? "correct" : "wrong", frames };
  });

export const evaluate = ({ data, answer }: { data: Data; answer?: Answer }): BitResult => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const states = stackStates(data, answer);
  const total = states.length;
  const correct = states.filter((state) => state.state === "correct").length;
  const allRight = total > 0 && correct === total;

  // All or nothing when the author says so, and when there is nothing to
  // count: a task with no moments would otherwise be scored out of zero.
  const score =
    data.partialCredit && total > 0
      ? { earned: correct, possible: total }
      : { earned: allRight ? 1 : 0, possible: 1 };

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { stacks: states },
  };
};
