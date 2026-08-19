import type { BitResult } from "@bitflow/core";
import { lands, named } from "./geometry";
import type { Annotation, Answer, Data, RegionOutcome } from "./schema";

/**
 * Which mark answers which region.
 *
 * Each region takes at most one mark and each mark answers at most one region,
 * so covering the picture in marks cannot collect every point. Matched in the
 * author's order, taking the first mark that lands and is named right — a
 * learner who placed two marks on one thing has still only found it once.
 *
 * A mark in the right place with the wrong name is recorded as such rather
 * than thrown away: "you found it and called it something else" is a different
 * thing to be told from "you did not find it".
 */
export const outcomes = (data: Data, answer?: Answer): RegionOutcome[] => {
  const marks = answer?.annotations ?? [];
  const taken = new Set<string>();

  return data.regions.map((region) => {
    const placed = marks.filter(
      (mark) => !taken.has(mark.id) && lands(mark, region, data),
    );
    const right = placed.find((mark) => named(mark, region, data));

    if (right) {
      taken.add(right.id);
      return { regionId: region.id, label: region.label, annotationId: right.id };
    }
    if (placed.length > 0) {
      taken.add(placed[0].id);
      return {
        regionId: region.id,
        label: region.label,
        annotationId: placed[0].id,
        labelWrong: true,
      };
    }
    return { regionId: region.id, label: region.label };
  });
};

/** The marks that answered nothing. */
export const extras = (data: Data, answer?: Answer): Annotation[] => {
  const used = new Set(
    outcomes(data, answer)
      .map((outcome) => outcome.annotationId)
      .filter(Boolean),
  );
  return (answer?.annotations ?? []).filter((mark) => !used.has(mark.id));
};

export const evaluate = ({
  data,
  answer,
}: {
  data: Data;
  answer?: Answer;
}): BitResult => {
  const marks = outcomes(data, answer);
  const stray = extras(data, answer);
  const detail = { regions: marks, extras: stray.map((mark) => mark.id) };

  if (data.evaluation.mode === "skip") {
    return { state: "unknown", allowRetry: false, detail };
  }

  const found = marks.filter(
    (outcome) => outcome.annotationId && !outcome.labelWrong,
  ).length;
  const possible = data.regions.length;
  const penalty = data.penaliseExtras ? stray.length : 0;

  return {
    state: found === possible && possible > 0 && stray.length === 0 ? "correct" : "wrong",
    // Never below zero: a task cannot take marks off the rest of the
    // assessment, whatever a learner does to this picture.
    score: { earned: Math.max(0, found - penalty), possible },
    allowRetry: data.evaluation.enableRetry,
    detail,
  };
};
