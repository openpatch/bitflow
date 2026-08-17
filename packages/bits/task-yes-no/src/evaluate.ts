import type { BitResult } from "@bitflow/core";
import type { Answer, Data } from "./schema";

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
  if (data.evaluation.mode === "manual") {
    return {
      state: "manual",
      score: { earned: 0, possible: 1 },
      allowRetry: data.evaluation.enableRetry,
    };
  }

  // No answer is a wrong answer rather than an unassessed one: the learner had
  // two options and chose neither, which is different from skipping.
  const correct = answer !== undefined && answer.yes === data.correctAnswer;

  const feedback =
    !correct && data.evaluation.showFeedback && answer !== undefined
      ? answer.yes
        ? data.feedbackWhenYes
        : data.feedbackWhenNo
      : undefined;

  return {
    state: correct ? "correct" : "wrong",
    score: { earned: correct ? 1 : 0, possible: 1 },
    allowRetry: data.evaluation.enableRetry,
    feedback: feedback ? [feedback] : undefined,
  };
};
