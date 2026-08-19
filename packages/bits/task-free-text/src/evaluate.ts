import type { BitResult } from "@bitflow/core";
import {
  lengthOf,
  type Answer,
  type Criterion,
  type CriterionOutcome,
  type Data,
} from "./schema";

/**
 * Whether a criterion's words appear in the answer.
 *
 * Whole words, not substrings: "sort" must not be met by "assortment", and
 * "or" must not be met by every second sentence. Matched by scanning the
 * answer's own words rather than by building a `RegExp` out of author text,
 * which would make an author's stray `(` an exception in a learner's browser.
 */
export const mentions = (
  text: string,
  criterion: Criterion,
  caseSensitive: boolean,
): boolean => {
  const fold = (value: string) => (caseSensitive ? value : value.toLowerCase());
  // Anything that is not a letter, a digit, an underscore or an inner
  // apostrophe ends a word. Unicode-aware, so "größer" and "récursif" are one
  // word each rather than two.
  const words = new Set(
    fold(text)
      .split(/[^\p{L}\p{N}_'’]+/u)
      .filter(Boolean),
  );

  return criterion.keywords
    .map((keyword) => fold(keyword.trim()))
    .filter(Boolean)
    .some((keyword) => {
      const parts = keyword.split(/[^\p{L}\p{N}_'’]+/u).filter(Boolean);
      if (parts.length === 0) return false;
      // A phrase is looked for as a phrase, in order, in the folded text.
      if (parts.length > 1) return fold(text).includes(keyword);
      return words.has(parts[0]);
    });
};

export const outcomes = (data: Data, text: string): CriterionOutcome[] =>
  data.criteria.map((criterion) => ({
    criterionId: criterion.id,
    label: criterion.label,
    points: criterion.points,
    met:
      data.marking === "keywords"
        ? mentions(text, criterion, data.caseSensitive)
        : undefined,
  }));

export const evaluate = ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): BitResult => {
  const text = answer?.text ?? "";
  const marks = outcomes(data, text);
  const detail = { criteria: marks, length: lengthOf(text) };

  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false, detail };
  }

  /*
   * A paragraph nobody has read is not correct and it is not wrong.
   *
   * `unknown` scores nothing out of nothing, which is how this system says
   * "not applicable" — so a task waiting for a person neither pays the learner
   * for writing something nor drags their total down for writing something
   * good. The text is in `detail` either way, which is the whole point: it is
   * there for the reader who *can* mark it.
   */
  if (data.marking === "person") {
    return {
      state: "unknown",
      allowRetry: data.evaluation.enableRetry,
      detail: { ...detail, awaitingReader: true },
    };
  }

  const possible = marks.reduce((total, mark) => total + mark.points, 0);
  const earned = marks
    .filter((mark) => mark.met)
    .reduce((total, mark) => total + mark.points, 0);

  return {
    // Every line mentioned is as close to "correct" as a keyword count can
    // honestly get, and it is still a statement about words rather than about
    // reasoning — which is what the learner is told in as many words.
    state: possible > 0 && earned === possible ? "correct" : "wrong",
    score: { earned, possible },
    allowRetry: data.evaluation.enableRetry,
    detail,
  };
};
