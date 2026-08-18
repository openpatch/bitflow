import { type BitResult } from "@bitflow/core";
import type { Answer, Data, ZoneState } from "./schema";

/**
 * A zone is right when it holds a label it accepts, and nothing else.
 *
 * Only zones that accept something are graded. A region with no accepted
 * labels is scenery — somewhere to park a spare, or part of a diagram the
 * author has not turned into a question — and grading it would make the task
 * unanswerable rather than harder.
 *
 * There is deliberately no separate "the learner must place every label"
 * setting. Whether an unplaced label matters is already decided by the zones:
 * if some zone wanted it, that zone is empty and the answer is not right; if
 * none did, it was a distractor and leaving it alone was correct.
 */
export const zoneStates = (
  data: Data,
  placements: Answer["placements"],
): Record<string, ZoneState> => {
  const states: Record<string, ZoneState> = {};

  for (const zone of data.zones) {
    if (zone.acceptedItemIds.length === 0) {
      states[zone.id] = "neutral";
      continue;
    }

    const held = placements.filter((placement) => placement.zoneId === zone.id);
    if (held.length === 0) {
      states[zone.id] = "empty";
      continue;
    }

    // Every label in the zone has to belong there: the right answer plus three
    // wrong ones is not the right answer.
    states[zone.id] = held.every((placement) =>
      zone.acceptedItemIds.includes(placement.itemId),
    )
      ? "correct"
      : "wrong";
  }

  return states;
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

  const states = zoneStates(data, answer?.placements ?? []);
  const graded = data.zones.filter((zone) => zone.acceptedItemIds.length > 0);

  const possible = graded.reduce((total, zone) => total + zone.score, 0);
  const earned = graded.reduce(
    (total, zone) => total + (states[zone.id] === "correct" ? zone.score : 0),
    0,
  );
  const allRight = possible > 0 && earned === possible;

  return {
    state: allRight ? "correct" : "wrong",
    score: data.partialCredit
      ? { earned, possible }
      : { earned: allRight ? possible : 0, possible },
    allowRetry: data.evaluation.enableRetry,
    detail: { zones: states },
  };
};
