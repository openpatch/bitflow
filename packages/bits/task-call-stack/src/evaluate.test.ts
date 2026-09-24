import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate, stackStates } from "./evaluate";
import { carriedStack, DataSchema, type Data } from "./schema";
import { framesToText, textToFrames } from "./views";

const frames = (...calls: string[]) => calls.map((call) => ({ call, locals: "" }));

const fak = (over: Partial<Data> = {}): Data =>
  DataSchema.parse({
    code: "int fak(int n) {\n  if (n <= 1) return 1;\n  return n * fak(n - 1);\n}",
    checkpoints: [
      { id: "m1", label: "fak(2) is called", line: 3, expected: frames("fak(2)", "fak(3)") },
      { id: "m2", label: "fak(1) is called", line: 2, expected: frames("fak(1)", "fak(2)", "fak(3)") },
    ],
    evaluation: defaultEvaluation(),
    ...over,
  });

describe("carriedStack", () => {
  it("starts a moment from the learner's stack for the moment before", () => {
    const data = fak();
    const answer = { stacks: { m1: frames("fak(2)", "fak(3)") } };
    expect(carriedStack(data, answer, 1)).toEqual(frames("fak(2)", "fak(3)"));
    expect(carriedStack(data, undefined, 0)).toEqual([]);
  });
});

describe("stackStates", () => {
  it("ignores spaces and case in a call", () => {
    const [state] = stackStates(fak(), { stacks: { m1: frames("FAK( 2 )", "fak(3)") } });
    expect(state.state).toBe("correct");
  });

  it("judges frames from the bottom, so a missing top leaves the rest right", () => {
    const states = stackStates(fak(), {
      stacks: { m1: frames("fak(2)", "fak(3)"), m2: frames("fak(2)", "fak(3)") },
    });
    expect(states[1]).toEqual({ state: "wrong", frames: [true, true] });
  });

  it("marks a frame out of place", () => {
    const [state] = stackStates(fak(), { stacks: { m1: frames("fak(3)", "fak(2)") } });
    expect(state).toEqual({ state: "wrong", frames: [false, false] });
  });

  it("compares local variables only when the task asks for them", () => {
    const withLocals = fak({
      showLocals: true,
      checkpoints: [
        { id: "m1", label: "", expected: [{ call: "fak(2)", locals: "n = 2" }] },
      ],
    });
    expect(
      stackStates(withLocals, { stacks: { m1: [{ call: "fak(2)", locals: "n=2" }] } })[0].state,
    ).toBe("correct");
    expect(
      stackStates(withLocals, { stacks: { m1: [{ call: "fak(2)", locals: "n=3" }] } })[0].state,
    ).toBe("wrong");
  });
});

describe("evaluate", () => {
  it("gives a point per moment with partial credit", () => {
    const result = evaluate({
      data: fak(),
      answer: { stacks: { m1: frames("fak(2)", "fak(3)") } },
    });
    expect(result.score).toEqual({ earned: 1, possible: 2 });
    expect(result.state).toBe("wrong");
  });

  it("is correct when every moment is", () => {
    const result = evaluate({
      data: fak(),
      answer: {
        stacks: {
          m1: frames("fak(2)", "fak(3)"),
          m2: frames("fak(1)", "fak(2)", "fak(3)"),
        },
      },
    });
    expect(result.state).toBe("correct");
  });
});

describe("DataSchema", () => {
  it("refuses a moment marked at a line the program does not have", () => {
    const result = DataSchema.safeParse({
      ...fak(),
      checkpoints: [{ id: "m", label: "", line: 99, expected: frames("f()") }],
    });
    expect(result.success).toBe(false);
  });

  it("wants local variables in every frame when the task asks for them", () => {
    const result = DataSchema.safeParse({ ...fak(), showLocals: true });
    expect(result.success).toBe(false);
  });
});

describe("framesToText and textToFrames", () => {
  it("write a stack a line per frame, locals after a bar, and read it back", () => {
    const stack = [
      { call: "fak(1)", locals: "n = 1" },
      { call: "main()", locals: "" },
    ];
    expect(framesToText(stack)).toBe("fak(1) | n = 1\nmain()");
    expect(textToFrames("fak(1) | n = 1\n\nmain()\n")).toEqual(stack);
  });
});
