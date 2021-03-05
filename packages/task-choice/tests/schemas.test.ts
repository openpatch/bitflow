import { evaluationSchema, taskSchema } from "../src/schemas";
import { ITask } from "../src/types";

describe("task schema", () => {
  it("should succeed validating", () => {
    const task: any = {
      title: "Title",
      instruction: "Instruction",
      choices: [{ markdown: "A" }, { markdown: "B" }],
      variant: "single",
    };

    const result = taskSchema.safeParse(task);

    expect(result.success).toBeTruthy();
  });

  it("should fail validating when missing choices", () => {
    const task: any = {
      title: "Title",
      instruction: "Instruction",
      variant: "single",
    };

    const result = taskSchema.safeParse(task);

    expect(result.success).toBeFalsy();
  });
});

describe("evaluation schema", () => {
  it("should succeed validating for single variant", () => {
    const task: ITask = {
      title: "Title",
      instruction: "Instruction",
      choices: [{ markdown: "A" }, { markdown: "B" }],
      variant: "single",
    };

    const evaluation: any = {
      mode: "auto",
      correct: ["a"],
      showFeedback: false,
      enableRetry: false,
    };

    const result = evaluationSchema({ task }).safeParse(evaluation);

    expect(result.success).toBeTruthy();
  });

  it("should fail validating for single variant with more than one correct", () => {
    const task: ITask = {
      title: "Title",
      instruction: "Instruction",
      choices: [{ markdown: "A" }, { markdown: "B" }],
      variant: "single",
    };

    const evaluation: any = {
      mode: "auto",
      correct: ["a", "b"],
      showFeedback: false,
      enableRetry: false,
    };

    const result = evaluationSchema({ task }).safeParse(evaluation);

    expect(result.success).toBeFalsy();
  });

  it("should fail validating when correct option not in task", () => {
    const task: ITask = {
      title: "Title",
      instruction: "Instruction",
      choices: [{ markdown: "A" }, { markdown: "B" }],
      variant: "single",
    };

    const evaluation: any = {
      mode: "auto",
      correct: ["c"],
      showFeedback: false,
      enableRetry: false,
    };

    const result = evaluationSchema({ task }).safeParse(evaluation);

    expect(result.success).toBeFalsy();
  });
});
