import { evaluate, kappa } from "../src/evaluate";
import { IAnswer } from "../src/types";
import { task } from "./fixtures";

describe("evaluate", () => {
  it("should evaluate correct", async () => {
    const answer: IAnswer = {
      highlights: [],
      subtype: "highlighting",
    };
    const result = await evaluate({
      task,
      answer,
    });
    expect(result).toEqual({
      allowRetry: true,
      state: "correct",
      subtype: "highlighting",
    });
  });

  it("should skip evaluation when mode manual", async () => {
    const answer: IAnswer = {
      highlights: [],
      subtype: "highlighting",
    };
    const result = await evaluate({
      task: { ...task, evaluation: { ...task.evaluation, mode: "manual" } },
      answer,
    });
    expect(result).toEqual({
      allowRetry: true,
      state: "manual",
      subtype: "highlighting",
    });
  });
});

describe("kappa", () => {
  it("should calculate kappa correctly", async () => {
    const k = kappa({
      agreeHighlight: 11,
      disagreeHighlight: 1,
      agreeNoHighlight: 7,
      disagreeNoHighlight: 1,
    });
    expect(k).toBeCloseTo(0.79, 2);
  });
});
