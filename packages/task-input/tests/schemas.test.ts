import { ITask, TaskSchema } from "../src/schemas";

describe("task schema", () => {
  it("should succeed validating", () => {
    const task: ITask = {
      subtype: "input",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
      },
      feedback: {
        patterns: [],
      },
      evaluation: {
        mode: "auto",
        pattern: "answer",
        enableRetry: false,
        showFeedback: false,
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeTruthy();
  });

  it("should fail validating with invalid pattern", () => {
    const task: ITask = {
      subtype: "input",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
      },
      feedback: {
        patterns: [],
      },
      evaluation: {
        mode: "auto",
        pattern: "answer[",
        enableRetry: false,
        showFeedback: false,
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeFalsy();
  });
});
