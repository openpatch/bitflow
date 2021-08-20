import { InteractiveFlowPublicNode } from "./flow";

export interface DoBaseTry {
  node: InteractiveFlowPublicNode;
  startDate: Date;
  try: number;
  status: string;
}

export interface DoStartedTry extends DoBaseTry {
  status: "started";
}

export const isDoStartedTry = (d: DoTry): d is DoStartedTry => {
  return d.status === "started";
};

export interface DoFinishedTry extends DoBaseTry {
  status: "finished";
  endDate: Date;
  answer?: Bitflow.TaskAnswer;
  result?: Bitflow.TaskResult;
}

export const isDoFinishedTry = (d: DoTry): d is DoFinishedTry => {
  return d.status === "finished";
};

export interface DoSkippedTry extends DoBaseTry {
  status: "skipped";
  evaluation: {
    mode: "auto" | "manual" | "skip";
  };
  endDate: Date;
}

export const isDoSkippedTry = (d: DoTry): d is DoSkippedTry => {
  return d.status === "skipped";
};

export type DoTry = DoStartedTry | DoSkippedTry | DoFinishedTry;

export const skipDoTry = (
  doResult: DoResult,
  evaluation: DoSkippedTry["evaluation"] = { mode: "skip" }
): DoResult => {
  const { tries } = doResult;
  let { maxPoints } = doResult;
  const currentTry = tries[tries.length - 1];

  const hasTry = tries.find(
    (doTry) =>
      doTry.node.id === currentTry.node.id && doTry.status !== "started"
  );

  if (!hasTry && evaluation?.mode !== "skip") {
    maxPoints += 1;
  }

  tries[tries.length - 1] = {
    ...currentTry,
    evaluation,
    status: "skipped",
    endDate: new Date(),
  };

  return {
    ...doResult,
    maxPoints,
    tries,
  };
};

export interface DoResult {
  points: number;
  maxPoints: number;
  startDate: Date;
  endDate: Date;
  tries: DoTry[];
}

export const finishDoTry = (
  doResult: DoResult,
  answer?: Bitflow.TaskAnswer,
  result?: Bitflow.TaskResult
): DoResult => {
  const { tries } = doResult;
  let { points, maxPoints } = doResult;
  const currentTry = tries[tries.length - 1] as any;

  const hasTry = tries.find(
    (doTry) =>
      doTry.node.id === currentTry.node.id && doTry.status !== "started"
  );

  if (!hasTry && result?.state !== "unknown") {
    maxPoints += 1;
  }

  tries[tries.length - 1] = {
    ...currentTry,
    status: "finished",
    endDate: new Date(),
    answer,
    result,
  };

  const lastTry = tries
    .filter(isDoFinishedTry)
    .find(
      (doTry) =>
        doTry.node.id === currentTry.node.id && currentTry.try - 1 === doTry.try
    );

  if (!lastTry && result?.state === "correct") {
    points += 1;
  } else if (
    lastTry?.result?.state === "correct" &&
    result?.state !== "correct"
  ) {
    points -= 1;
  } else if (
    lastTry?.result?.state !== "correct" &&
    result?.state === "correct"
  ) {
    points += 1;
  }

  return {
    ...doResult,
    maxPoints,
    points,
    tries,
  };
};

export const retryDoTry = (doResult: DoResult): DoResult => {
  const { tries } = doResult;
  const lastTry = tries[tries.length - 1];
  tries.push({
    status: "started",
    try: lastTry.try + 1,
    startDate: new Date(),
    node: {
      ...lastTry.node,
    },
  });

  return { ...doResult, tries };
};
