import { uuidv4 } from "@bitflow/base";
import { ITask, TaskSchema } from "../src/schemas";

describe("task schema", () => {
  it("should succeed validating", () => {
    const task: ITask = {
      subtype: "choice",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
        choices: [{ markdown: "A" }, { markdown: "B" }],
        variant: "single",
      },
      feedback: {
        choices: {},
        patterns: {},
      },
      evaluation: {
        mode: "auto",
        correct: [],
        enableRetry: false,
        showFeedback: false,
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeTruthy();
  });

  it("should fail validating when missing choices", () => {
    const task: any = {
      subtype: "choice",
      description: "desc",
      name: "name",
      id: uuidv4(),
      view: {
        instruction: "Instruction",
        variant: "single",
      },
      feedback: {
        choices: {},
        patterns: {},
      },
      evaluation: {
        mode: "auto",
        correct: [],
        enableRetry: false,
        showFeedback: false,
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeFalsy();
  });
});

describe("evaluation schema", () => {
  it("should succeed validating for single variant", () => {
    const task: ITask = {
      subtype: "choice",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
        choices: [{ markdown: "A" }, { markdown: "B" }],
        variant: "single",
      },
      evaluation: {
        mode: "auto",
        correct: ["a"],
        showFeedback: false,
        enableRetry: false,
      },
      feedback: {
        choices: {},
        patterns: {},
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeTruthy();
  });

  it("should fail validating for single variant with more than one correct", () => {
    const task: ITask = {
      subtype: "choice",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
        choices: [{ markdown: "A" }, { markdown: "B" }],
        variant: "single",
      },
      evaluation: {
        mode: "auto",
        correct: ["a", "b"],
        showFeedback: false,
        enableRetry: false,
      },
      feedback: {
        choices: {},
        patterns: {},
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeFalsy();
  });

  it("should fail validating when correct option not in task", () => {
    const task: ITask = {
      subtype: "choice",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
        choices: [{ markdown: "A" }, { markdown: "B" }],
        variant: "single",
      },
      evaluation: {
        mode: "auto",
        correct: ["c"],
        showFeedback: false,
        enableRetry: false,
      },
      feedback: {
        choices: {},
        patterns: {},
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeFalsy();
  });
});
