import type { BitResult } from "@bitflow/core";
import { COLORS, type Answer, type Color, type Data } from "./schema";

type AgreementMatrix = {
  bothHighlighted: number;
  bothPlain: number;
  onlyLearner: number;
  onlyReference: number;
};

/**
 * Cohen's kappa: agreement corrected for the agreement you would expect by
 * chance.
 *
 * Raw overlap is useless here — on a paragraph where the teacher highlighted
 * four words, a learner who highlights nothing agrees on 95% of the characters.
 * Kappa scores that at zero, which is what it is worth.
 *
 * Returns 0 rather than NaN when there is nothing to compare or when chance
 * agreement is total.
 */
export const kappa = ({
  bothHighlighted,
  bothPlain,
  onlyLearner,
  onlyReference,
}: AgreementMatrix): number => {
  const total = bothHighlighted + bothPlain + onlyLearner + onlyReference;
  if (total === 0) return 0;

  const observed = (bothHighlighted + bothPlain) / total;
  const expected =
    ((bothHighlighted + onlyLearner) / total) *
      ((bothHighlighted + onlyReference) / total) +
    ((bothPlain + onlyReference) / total) * ((bothPlain + onlyLearner) / total);

  if (expected === 1) return 0;
  const value = (observed - expected) / (1 - expected);
  return Number.isFinite(value) ? value : 0;
};

export const agreementPerColor = (
  data: Data,
  highlights: Array<Color | null>,
): Partial<Record<Color, number>> => {
  const agreement: Partial<Record<Color, number>> = {};

  for (const color of COLORS) {
    if (!data.colors[color]?.enabled) continue;

    const matrix: AgreementMatrix = {
      bothHighlighted: 0,
      bothPlain: 0,
      onlyLearner: 0,
      onlyReference: 0,
    };

    for (let i = 0; i < data.text.length; i++) {
      const learner = highlights[i] === color;
      const reference = data.reference[i] === color;
      if (learner && reference) matrix.bothHighlighted += 1;
      else if (!learner && !reference) matrix.bothPlain += 1;
      else if (learner) matrix.onlyLearner += 1;
      else matrix.onlyReference += 1;
    }

    agreement[color] = kappa(matrix);
  }

  return agreement;
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
  const agreement = agreementPerColor(data, answer?.highlights ?? []);
  const colors = Object.keys(agreement) as Color[];

  const met = colors.filter(
    (color) => (agreement[color] ?? 0) >= (data.cutoffs[color] ?? 0.6),
  );
  const allMet = colors.length > 0 && met.length === colors.length;

  return {
    state: allMet ? "correct" : "wrong",
    score: { earned: allMet ? 1 : 0, possible: 1 },
    allowRetry: data.evaluation.enableRetry,
    detail: { agreement },
  };
};
