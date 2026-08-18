import type { BitResult } from "@bitflow/core";
import { hotspotAt } from "./geometry";
import type { Answer, Data } from "./schema";

/**
 * One click, one mark.
 *
 * H5P's model, and the right one for this task: the learner is asked where
 * something is and answers once. Several regions may be correct — any of them
 * wins — and the rest are there to be wrong usefully, each with its own word
 * about why.
 */
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

  const selection = answer?.selection;
  const chosen = selection
    ? hotspotAt(data.hotspots, selection)
    : undefined;
  const right = chosen?.correct === true;

  return {
    state: right ? "correct" : "wrong",
    score: { earned: right ? 1 : 0, possible: 1 },
    allowRetry: data.evaluation.enableRetry,
    detail: {
      // What was chosen, so the report can show it and the task can say the
      // author's own word about that spot.
      hotspotId: chosen?.id,
      // A choice that hit nothing at all is worth telling apart from one that
      // hit the wrong region: it usually means they had not found anything.
      missed: selection !== undefined && chosen === undefined,
      feedback: chosen?.feedback ?? (selection ? data.missFeedback : undefined),
    },
  };
};
