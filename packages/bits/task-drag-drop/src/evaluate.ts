import type { BitResult } from "@bitflow/core";
import { overlapArea, satisfies } from "./layout";
import type { Answer, Data, DropZone, Element, Placement } from "./schema";

/**
 * The zones an element belongs in, according to the zones themselves.
 *
 * Belonging is the zone's say, and the only say there is: nothing constrains
 * where an element may be *put*, so a wrong answer is simply one left
 * somewhere that does not want it.
 */
export const homesOf = (data: Data, elementId: string): string[] =>
  data.dropZones
    .filter((zone) => zone.correctElementIds.includes(elementId))
    .map((zone) => zone.id);

/**
 * The region an element has come to rest on, or `undefined` for open ground.
 *
 * Each region says for itself how much of the element it wants — see
 * `Tolerance`. Where an element satisfies several at once, which `touch`
 * makes easy, the one it covers most wins: that is the region the learner was
 * aiming at, and picking by draw order instead would turn a near-miss into a
 * mark on a region they barely grazed.
 */
export const zoneUnder = (
  data: Data,
  element: Element,
  placement: Placement,
): DropZone | undefined => {
  const box = {
    x: placement.x,
    y: placement.y,
    width: element.width,
    height: element.height,
  };

  let best: DropZone | undefined;
  let bestArea = -1;
  for (const zone of data.dropZones) {
    if (!satisfies(box, zone, zone.tolerance)) continue;
    const area = overlapArea(box, zone);
    // `>=` so a later region wins a tie, keeping "drawn on top" meaningful.
    if (area >= bestArea) {
      best = zone;
      bestArea = area;
    }
  }
  return best;
};

/**
 * The most an answer can earn, following H5P: one point per element that
 * belongs somewhere, or — for an element that can be used more than once —
 * one point per zone it belongs in, since it can fill all of them at once.
 *
 * Elements that belong nowhere are distractors and add nothing to the total;
 * leaving one on a zone is what the penalty is for.
 */
export const maxScore = (data: Data): number =>
  data.elements.reduce((total, element) => {
    const homes = homesOf(data, element.id);
    if (homes.length === 0) return total;
    return total + (element.multiple ? homes.length : 1);
  }, 0);

export type Judged = Placement & {
  /** The zone it landed in, if any. */
  zoneId?: string;
  /** `undefined` where it landed on open ground: neither right nor wrong. */
  state?: "correct" | "wrong";
};

/** What each element the learner moved is worth, and why. */
export const judge = (data: Data, placements: Placement[]): Judged[] =>
  placements.map((placement) => {
    const element = data.elements.find(
      (candidate) => candidate.id === placement.elementId,
    );
    if (!element) return placement;

    const zone = zoneUnder(data, element, placement);
    if (!zone) {
      // Open ground. Not an answer, so not a mistake either — the same as
      // never having moved it.
      return placement;
    }
    return {
      ...placement,
      zoneId: zone.id,
      state: zone.correctElementIds.includes(element.id) ? "correct" : "wrong",
    };
  });

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

  const judged = judge(data, answer?.placements ?? []);
  const right = judged.filter((placement) => placement.state === "correct").length;
  const wrong = judged.filter((placement) => placement.state === "wrong").length;

  const possible = maxScore(data);
  /*
   * With penalties on, a misplaced element cancels a correctly placed one, so
   * scattering everything across every zone earns nothing. Floored at zero: a
   * bad guess is worth no points, not negative ones that would eat into the
   * rest of the assessment.
   */
  const earned = Math.max(0, data.applyPenalties ? right - wrong : right);
  const allRight = possible > 0 && earned === possible;

  return {
    state: allRight ? "correct" : "wrong",
    // All or nothing, for a task the author wants to count as one question.
    score: data.singlePoint
      ? { earned: allRight ? 1 : 0, possible: 1 }
      : { earned, possible },
    allowRetry: data.evaluation.enableRetry,
    detail: { placements: judged },
  };
};
