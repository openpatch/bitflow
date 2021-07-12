import { DoTry } from "@bitflow/core";

export const collectResults = (tries: DoTry[], nodeIds: string[]) => {
  const results: Record<string, Bitflow.TaskResult> = {};

  tries.forEach((t) => {
    if (nodeIds.includes(t.node.id) && t.status === "finished" && t.result) {
      results[t.node.id] = t.result as Bitflow.TaskResult;
    }
  });

  return results;
};

export const collectAnswers = (tries: DoTry[], nodeIds: string[]) => {
  const answers: Record<string, Bitflow.TaskAnswer> = {};

  tries.forEach((t) => {
    if (nodeIds.includes(t.node.id) && t.status === "finished" && t.answer) {
      answers[t.node.id] = t.answer as Bitflow.TaskAnswer;
    }
  });

  return answers;
};
