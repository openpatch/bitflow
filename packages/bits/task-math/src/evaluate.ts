import type { BitResult, FeedbackMessage } from "@bitflow/core";
import { matchesAny, sameMath } from "./compare";
import { acceptedFor, answerNamesIn, type Answer, type Data } from "./schema";

/** How one blank came out. */
export type BlankOutcome = {
  name: string;
  /** The LaTeX the learner wrote, kept for the report. */
  given: string;
  correct: boolean;
};

/**
 * Marking is asynchronous because the algebra engine is loaded on demand.
 *
 * `Evaluate` has always been allowed to return a promise — the flow awaits it —
 * so this costs nothing anywhere else. It is the reason the engine can stay
 * out of the bundle until a maths question is actually reached.
 */
export const evaluate = async ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): Promise<BitResult> => {
  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }

  const names = answerNamesIn(data.latex);
  const prompts = answer?.prompts ?? {};

  const outcomes: BlankOutcome[] = [];
  for (const name of names) {
    const given = prompts[name] ?? "";
    const accepted = acceptedFor(data, name);
    outcomes.push({
      name,
      given,
      correct:
        accepted.length > 0 &&
        (await matchesAny(given, accepted, {
          mode: data.compare,
          tolerance: data.tolerance,
        })),
    });
  }

  const right = outcomes.filter((outcome) => outcome.correct).length;
  const allRight = names.length > 0 && right === names.length;

  // Partial credit is per blank and out of one, so a five-blank question is
  // worth the same as a one-blank one and `evaluation.weight` stays the only
  // place a task's worth is decided.
  const score =
    data.partialCredit && names.length > 0
      ? { earned: right / names.length, possible: 1 }
      : { earned: allRight ? 1 : 0, possible: 1 };

  const feedback: FeedbackMessage[] = [];
  if (data.evaluation.showFeedback) {
    for (const entry of data.blankFeedback) {
      const given = prompts[entry.blank] ?? "";
      if (
        given.trim() !== "" &&
        (await sameMath(given, entry.latex, {
          mode: data.compare,
          tolerance: data.tolerance,
        }))
      ) {
        feedback.push(entry.feedback);
      }
    }
  }

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    feedback: feedback.length > 0 ? feedback : undefined,
    // Per blank, so the field can mark each one where it stands and a reviewer
    // can see which half of a formula was wrong.
    detail: { blanks: outcomes },
  };
};
