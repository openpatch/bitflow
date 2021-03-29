import { ITask, TaskSchema } from "../src/schemas";

describe("task schema", () => {
  it("should succeed validating", () => {
    const task: ITask = {
      subtype: "fill-in-the-blank",
      description: "desc",
      name: "name",
      view: {
        instruction: "Instruction",
        textWithBlanks: "~~A~~",
      },
      feedback: {
        blanks: {},
      },
      evaluation: {
        mode: "auto",
        blanks: {},
        enableRetry: false,
        showFeedback: false,
      },
    };

    const result = TaskSchema.safeParse(task);

    expect(result.success).toBeTruthy();
  });
});
