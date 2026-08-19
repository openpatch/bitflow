import type { BitResult, FeedbackMessage } from "@bitflow/core";
import {
  canonicalUnit,
  parseQuantity,
  type DecimalSeparator,
  type ParseFailure,
} from "./expression";
import { acceptedUnits, type Answer, type Data } from "./schema";

/**
 * Floating-point slack, so `0.1 + 0.2` is `0.3`.
 *
 * Relative rather than absolute: the same rule has to hold for an answer in
 * nanometres and an answer in light years. This is not a tolerance the author
 * sets — it only stops binary representation deciding a mark.
 */
const nearlyEqual = (a: number, b: number, epsilon = 1e-9): boolean => {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= epsilon * Math.max(1, scale);
};

/** Rounded to a number of decimal places. */
export const roundToDecimals = (value: number, digits: number): number => {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e21) return value;
  return Number(value.toFixed(Math.min(10, Math.max(0, digits))));
};

/** Rounded to a number of significant figures. */
export const roundToSignificant = (value: number, digits: number): number => {
  if (!Number.isFinite(value) || value === 0) return value;
  return Number(value.toPrecision(Math.min(21, Math.max(1, digits))));
};

/**
 * Whether a value is close enough to the expected one.
 *
 * Exported because the form uses it to show the author the range they have
 * just set, and because "what would be accepted" is a question worth being
 * able to answer without submitting an answer.
 */
export const withinTolerance = (
  given: number,
  expected: number,
  data: Data,
): boolean => {
  switch (data.tolerance) {
    case "absolute":
      return Math.abs(given - expected) <= data.toleranceValue + Number.EPSILON;
    case "percent": {
      const allowed = (Math.abs(expected) * data.toleranceValue) / 100;
      // A percentage of nothing is nothing, so an expected zero falls back to
      // an exact comparison rather than accepting only a literal zero by luck.
      return Math.abs(given - expected) <= allowed + Number.EPSILON;
    }
    case "decimals":
      return nearlyEqual(
        roundToDecimals(given, data.digits),
        roundToDecimals(expected, data.digits),
      );
    case "significant":
      return nearlyEqual(
        roundToSignificant(given, data.digits),
        roundToSignificant(expected, data.digits),
      );
    case "exact":
    default:
      return nearlyEqual(given, expected);
  }
};

/** The two ends of what would be accepted, when that is a range at all. */
export const acceptedRange = (
  expected: number,
  data: Data,
): { from: number; to: number } | undefined => {
  switch (data.tolerance) {
    case "absolute":
      return {
        from: expected - data.toleranceValue,
        to: expected + data.toleranceValue,
      };
    case "percent": {
      const allowed = (Math.abs(expected) * data.toleranceValue) / 100;
      return { from: expected - allowed, to: expected + allowed };
    }
    default:
      return undefined;
  }
};

/** What the task made of the learner's text, and how it marked it. */
export type Reading = {
  /** The number it came to, absent when it could not be read. */
  value?: number;
  /** Why it could not be read. */
  error?: ParseFailure;
  /** The unit as it was typed, empty when none was given. */
  unit: string;
  valueCorrect: boolean;
  /** Whether the unit was accepted. Always true when none is asked for. */
  unitCorrect: boolean;
  /** What the author expected, so a reviewer need not re-derive it. */
  expected?: number;
};

/**
 * Reads an answer and marks it, without deciding anything about scoring.
 *
 * Split out because three callers want it: `evaluate`, the learner's view —
 * which shows the reading as it is typed, so nobody is marked on a number they
 * cannot see — and the authoring form's preview.
 */
export const read = (data: Data, input: string): Reading => {
  const options = {
    decimalSeparator: data.decimalSeparator as DecimalSeparator,
    allowExpression: data.allowExpression,
  };

  const expected = parseQuantity(data.expected, {
    ...options,
    allowExpression: true,
  });
  const given = parseQuantity(input, options);

  if (!given.ok) {
    return {
      error: given.error,
      unit: "",
      valueCorrect: false,
      unitCorrect: false,
      expected: expected.ok ? expected.value : undefined,
    };
  }

  const valueCorrect = expected.ok && withinTolerance(given.value, expected.value, data);

  return {
    value: given.value,
    unit: given.unit,
    valueCorrect,
    unitCorrect: unitAccepted(data, given.unit),
    expected: expected.ok ? expected.value : undefined,
  };
};

/**
 * Whether the unit the learner gave is one the author accepts.
 *
 * A wrong unit is wrong in every mode — `9.81 m/s` is not the answer whatever
 * the box beside it said. What the mode decides is whether leaving it out is
 * allowed: with the unit printed next to the field the learner was never asked
 * for it, so silence is fine.
 */
export const unitAccepted = (data: Data, given: string): boolean => {
  const accepted = acceptedUnits(data).map(canonicalUnit);
  const typed = canonicalUnit(given);

  if (data.unitMode === "none") return typed === "";
  if (typed === "") return data.unitMode === "shown";
  return accepted.includes(typed);
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

  const input = answer?.input ?? "";
  const reading = read(data, input);

  // The unit is only a mark of its own where the learner had to produce it;
  // everywhere else it is part of getting the answer right or it is nothing.
  const unitScored = data.scoring === "valueAndUnit" && data.unitMode === "required";
  const possible = unitScored ? 2 : 1;
  const valuePoint = reading.valueCorrect ? 1 : 0;
  const earned = unitScored
    ? valuePoint + (reading.unitCorrect ? 1 : 0)
    : reading.valueCorrect && reading.unitCorrect
      ? 1
      : 0;

  const feedback: FeedbackMessage[] = [];
  if (data.evaluation.showFeedback && reading.value !== undefined) {
    for (const entry of data.valueFeedback) {
      const target = parseQuantity(entry.value, {
        decimalSeparator: data.decimalSeparator as DecimalSeparator,
        allowExpression: true,
      });
      if (target.ok && withinTolerance(reading.value, target.value, data)) {
        feedback.push(entry.feedback);
      }
    }
  }

  return {
    state: earned === possible ? "correct" : "wrong",
    score: { earned, possible },
    allowRetry: data.evaluation.enableRetry,
    feedback: feedback.length > 0 ? feedback : undefined,
    // The reading the score was worked out from, alongside the raw text in the
    // answer. A reviewer can see both what was typed and what it was taken to
    // mean, which is the pair that makes a disputed mark settleable.
    detail: {
      input,
      value: reading.value,
      unit: reading.unit,
      expected: reading.expected,
      valueCorrect: reading.valueCorrect,
      unitCorrect: reading.unitCorrect,
      unitScored,
      error: reading.error,
    },
  };
};
