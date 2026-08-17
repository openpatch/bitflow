import type { BitResult } from "@bitflow/core";
import { blankIdsIn, type Answer, type BlankState, type Data } from "./schema";

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

  const ids = blankIdsIn(data.text);

  if (data.evaluation.mode === "manual") {
    return {
      state: "manual",
      score: { earned: 0, possible: 1 },
      allowRetry: data.evaluation.enableRetry,
      detail: {
        blanks: Object.fromEntries(ids.map((id) => [id, "neutral" as BlankState])),
      },
    };
  }

  const blanks: Record<string, BlankState> = {};
  let right = 0;

  for (const id of ids) {
    const given = normalise(answer?.blanks?.[id] ?? "", data);
    const accepted = (data.blanks[id] ?? [])
      .map((value) => normalise(value, data))
      .filter((value) => value !== "");

    const correct = accepted.some((value) => compare(value, data) === compare(given, data));
    if (correct) right += 1;
    blanks[id] = correct ? "correct" : "wrong";
  }

  const allRight = ids.length > 0 && right === ids.length;
  const score =
    data.partialCredit && ids.length > 0
      ? { earned: right / ids.length, possible: 1 }
      : { earned: allRight ? 1 : 0, possible: 1 };

  return {
    state: allRight ? "correct" : "wrong",
    score,
    allowRetry: data.evaluation.enableRetry,
    detail: { blanks },
  };
};

const normalise = (value: string, data: Data): string =>
  data.trim ? value.trim() : value;

const compare = (value: string, data: Data): string =>
  data.caseSensitive ? value : value.toLowerCase();
