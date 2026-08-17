import type { BitResult, FeedbackMessage } from "@bitflow/core";
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

  const given = normalise(answer?.input ?? "", data);
  const correct = matches(given, data);

  const feedback: FeedbackMessage[] = [];
  if (data.evaluation.showFeedback) {
    for (const entry of data.patternFeedback) {
      if (safeTest(entry.pattern, given, data.caseSensitive)) {
        feedback.push(entry.feedback);
      }
    }
  }

  return {
    state: correct ? "correct" : "wrong",
    score: { earned: correct ? 1 : 0, possible: 1 },
    allowRetry: data.evaluation.enableRetry,
    feedback: feedback.length > 0 ? feedback : undefined,
  };
};

const normalise = (value: string, data: Data): string =>
  data.trim ? value.trim() : value;

const matches = (given: string, data: Data): boolean => {
  if (data.matchMode === "regex") {
    return safeTest(data.pattern, given, data.caseSensitive);
  }

  const compare = (value: string) =>
    data.caseSensitive ? value : value.toLowerCase();
  const actual = compare(given);

  return data.expected
    .map((value) => compare(normalise(value, data)))
    .filter((value) => value !== "")
    .some((value) =>
      data.matchMode === "exact" ? actual === value : actual.includes(value),
    );
};

/**
 * An invalid pattern means the answer does not match, rather than an exception
 * that would take the whole flow down. The schema already refuses to save one,
 * so this only catches a hand-edited file.
 */
const safeTest = (
  pattern: string,
  value: string,
  caseSensitive: boolean,
): boolean => {
  if (!pattern) return false;
  try {
    return new RegExp(pattern, caseSensitive ? "" : "i").test(value);
  } catch {
    return false;
  }
};
