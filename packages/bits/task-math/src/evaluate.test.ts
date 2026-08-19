// @vitest-environment node
import { defaultEvaluation } from "@bitflow/core";
import { describe, expect, it } from "vitest";
import { evaluate } from "./evaluate";
import { DataSchema, type Data } from "./schema";

const make = (changes: Partial<Data> = {}): Data =>
  DataSchema.parse({
    latex: "",
    blanks: { answer: { expected: "2x", accepted: [] } },
    ...changes,
  });

const mark = (data: Data, prompts: Record<string, string>) =>
  evaluate({ data, answer: { prompts } });

describe("a single answer", () => {
  it("marks the whole field against the expected expression", async () => {
    const data = make();
    expect((await mark(data, { answer: "2x" })).state).toBe("correct");
    expect((await mark(data, { answer: "x\\cdot 2" })).state).toBe("correct");
    expect((await mark(data, { answer: "x^2" })).state).toBe("wrong");
  });

  it("is wrong, not blank, for no answer at all", async () => {
    expect((await evaluate({ data: make(), answer: undefined })).state).toBe("wrong");
    expect((await mark(make(), {})).score).toEqual({ earned: 0, possible: 1 });
  });

  it("takes the author's alternatives too", async () => {
    const data = make({
      blanks: { answer: { expected: "\\frac{1}{2}", accepted: ["0.5", "50\\%"] } },
    });
    expect((await mark(data, { answer: "0.5" })).state).toBe("correct");
  });
});

describe("blanks", () => {
  const data = make({
    latex: "x=\\placeholder[a]{}+\\placeholder[b]{}",
    blanks: {
      a: { expected: "2", accepted: [] },
      b: { expected: "3", accepted: [] },
    },
  });

  it("marks each blank on its own", async () => {
    const result = await mark(data, { a: "2", b: "3" });
    expect(result.state).toBe("correct");
    expect(result.detail?.blanks).toEqual([
      { name: "a", given: "2", correct: true },
      { name: "b", given: "3", correct: true },
    ]);
  });

  it("gives partial credit for the half that was right", async () => {
    const result = await mark(data, { a: "2", b: "9" });
    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0.5, possible: 1 });
  });

  it("can be all or nothing instead", async () => {
    const strict = { ...data, partialCredit: false };
    expect((await mark(strict, { a: "2", b: "9" })).score).toEqual({
      earned: 0,
      possible: 1,
    });
    expect((await mark(strict, { a: "2", b: "3" })).score).toEqual({
      earned: 1,
      possible: 1,
    });
  });

  it("is worth one mark however many blanks it has", async () => {
    // Otherwise a five-blank question would quietly outweigh a five-part one,
    // and `evaluation.weight` would stop being the place that decides.
    const five = make({
      latex: [1, 2, 3, 4, 5].map((n) => `\\placeholder[b${n}]{}`).join("+"),
      blanks: Object.fromEntries(
        [1, 2, 3, 4, 5].map((n) => [`b${n}`, { expected: String(n), accepted: [] }]),
      ),
    });
    const result = await mark(five, { b1: "1", b2: "2", b3: "3", b4: "4", b5: "5" });
    expect(result.score).toEqual({ earned: 1, possible: 1 });
  });

  it("ignores a prompt the formula does not have", async () => {
    const result = await mark(data, { a: "2", b: "3", ghost: "99" });
    expect(result.detail?.blanks).toHaveLength(2);
  });
});

describe("feedback", () => {
  const data = make({
    blankFeedback: [
      {
        blank: "answer",
        latex: "x^2",
        feedback: { message: "You squared it instead of doubling it.", severity: "info" },
      },
    ],
  });

  it("fires on the answer it names", async () => {
    expect((await mark(data, { answer: "x^2" })).feedback).toEqual([
      { message: "You squared it instead of doubling it.", severity: "info" },
    ]);
    expect((await mark(data, { answer: "2x" })).feedback).toBeUndefined();
  });

  it("stays quiet when the author turned feedback off", async () => {
    const quiet = {
      ...data,
      evaluation: { ...defaultEvaluation(), showFeedback: false },
    };
    expect((await mark(quiet, { answer: "x^2" })).feedback).toBeUndefined();
  });
});

describe("grading switched off", () => {
  it("returns unknown and never loads the engine", async () => {
    const data = make({ evaluation: { ...defaultEvaluation(), mode: "skip" } });
    expect(await evaluate({ data, answer: { prompts: { answer: "nonsense" } } })).toEqual({
      state: "unknown",
      allowRetry: false,
    });
  });
});

describe("marking is self-contained", () => {
  it("asks nothing outside itself", async () => {
    const fetchBefore = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error("evaluate must not make a request");
    }) as typeof fetch;
    expect((await mark(make(), { answer: "2x" })).state).toBe("correct");
    globalThis.fetch = fetchBefore;
  });

  it("marks rather than throws on a formula that will not parse", async () => {
    const broken = make({
      blanks: { answer: { expected: "\\frac{1}{", accepted: [] } },
    });
    const result = await mark(broken, { answer: "2x" });
    expect(result.state).toBe("wrong");
  });
});
