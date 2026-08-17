import type { BitResult, FeedbackMessage } from "@bitflow/core";
import type { Answer, ChoiceState, Data } from "./schema";

/**
 * Grades a choice answer in the browser.
 *
 * Pure and synchronous — no network, no clock, no randomness — so the same
 * answer always produces the same result, which is what makes an attempt
 * snapshot replayable and the group statistics meaningful.
 */
export const evaluate = ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): BitResult => {
  const selected = new Set(answer?.selected ?? []);

  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false };
  }
  if (data.evaluation.mode === "manual") {
    return {
      state: "manual",
      score: { earned: 0, possible: 1 },
      allowRetry: data.evaluation.enableRetry,
      detail: { choices: neutralChoices(data) },
    };
  }

  const choices: Record<string, ChoiceState> = {};
  const feedback: FeedbackMessage[] = [];
  let right = 0;

  for (const choice of data.choices) {
    const checked = selected.has(choice.id);
    // Right means "matches what the teacher marked" — ticking a wrong choice
    // and leaving a correct one unticked are both mistakes.
    const correct = checked === choice.correct;
    if (correct) right += 1;
    choices[choice.id] = correct ? "correct" : "wrong";

    if (data.evaluation.showFeedback) {
      const message = checked
        ? choice.feedbackWhenChecked
        : choice.feedbackWhenNotChecked;
      if (message?.message) feedback.push(message);
    }
  }

  if (data.evaluation.showFeedback) {
    const pattern = matchPattern(data, selected);
    if (pattern) feedback.push(pattern);
  }

  const allRight = right === data.choices.length;
  const score = data.partialCredit
    ? { earned: right / data.choices.length, possible: 1 }
    : { earned: allRight ? 1 : 0, possible: 1 };

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    feedback: feedback.length > 0 ? feedback : undefined,
    detail: { choices },
  };
};

const neutralChoices = (data: Data): Record<string, ChoiceState> =>
  Object.fromEntries(data.choices.map((choice) => [choice.id, "neutral"]));

/**
 * Feedback keyed to one exact combination of ticked choices — for saying
 * something specific about a known misconception rather than just "wrong".
 */
const matchPattern = (
  data: Data,
  selected: Set<string>,
): FeedbackMessage | undefined =>
  data.patternFeedback.find(
    (pattern) =>
      pattern.choiceIds.length === selected.size &&
      pattern.choiceIds.every((id) => selected.has(id)),
  )?.feedback;
