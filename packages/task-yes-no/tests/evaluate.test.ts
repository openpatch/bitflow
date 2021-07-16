import { evaluate } from "../src/evaluate";
import { IAnswer } from "../src/types";
import { task } from "./fixtures";

describe("evaluate", () => {
  it("should evaluate correct", async () => {
    const answer: IAnswer = {
      yes: true,
      subtype: "yes-no",
    };
    const result = await evaluate({
      task,
      answer,
    });
    expect(result).toEqual({
      allowRetry: true,
      state: "correct",
      subtype: "yes-no",
    });
  });

  it("should skip evaluation when mode manual", async () => {
    const answer: IAnswer = {
      yes: true,
      subtype: "yes-no",
    };
    const result = await evaluate({
      task: { ...task, evaluation: { ...task.evaluation, mode: "manual" } },
      answer,
    });
    expect(result).toEqual({
      allowRetry: true,
      state: "manual",
      subtype: "yes-no",
    });
  });
});
