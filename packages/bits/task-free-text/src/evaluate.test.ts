import { describe, expect, it } from "vitest";
import { evaluate, mentions } from "./evaluate";
import { DataSchema, type Criterion, type CriterionOutcome, type Data } from "./schema";

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Why does binary search need a sorted list?",
    marking: "keywords",
    criteria: [
      { id: "sorted", label: "Mentions sorted order", keywords: ["sorted", "order"], points: 1 },
      { id: "halve", label: "Mentions halving", keywords: ["half", "halves", "middle"], points: 1 },
    ],
    ...over,
  });

const criterion = (over: Partial<Criterion> = {}): Criterion => ({
  id: "c",
  label: "",
  keywords: [],
  points: 1,
  ...over,
});

describe("mentions", () => {
  it("finds a word the answer uses", () => {
    expect(
      mentions("The list is sorted.", criterion({ keywords: ["sorted"] }), false),
    ).toBe(true);
  });

  /** "sort" inside "assortment" is a coincidence, not an idea. */
  it("does not find a word inside a longer one", () => {
    expect(
      mentions("An assortment of values.", criterion({ keywords: ["sort"] }), false),
    ).toBe(false);
  });

  it("takes any one of the words", () => {
    const c = criterion({ keywords: ["half", "middle"] });
    expect(mentions("look at the middle", c, false)).toBe(true);
    expect(mentions("take half", c, false)).toBe(true);
    expect(mentions("look at the end", c, false)).toBe(false);
  });

  it("ignores capitals unless it is told not to", () => {
    const c = criterion({ keywords: ["sorted"] });
    expect(mentions("Sorted.", c, false)).toBe(true);
    expect(mentions("Sorted.", c, true)).toBe(false);
  });

  it("looks for a phrase as a phrase", () => {
    const c = criterion({ keywords: ["binary search"] });
    expect(mentions("a binary search halves it", c, false)).toBe(true);
    expect(mentions("search the binary tree", c, false)).toBe(false);
  });

  it("reads a word with an accent or an umlaut as one word", () => {
    expect(
      mentions("die größere Hälfte", criterion({ keywords: ["größere"] }), false),
    ).toBe(true);
  });

  it("finds nothing when there is nothing to look for", () => {
    expect(mentions("anything at all", criterion({ keywords: [] }), false)).toBe(
      false,
    );
    expect(mentions("anything", criterion({ keywords: ["  "] }), false)).toBe(false);
  });
});

describe("evaluate", () => {
  /**
   * The whole point of the bit. A paragraph nobody has read is not correct and
   * it is not wrong, and `unknown` scores nothing out of nothing — so it
   * neither pays the learner for writing something nor drags their total down.
   */
  it("waits for a person rather than guessing", () => {
    const result = evaluate({
      data: data({ marking: "person" }),
      answer: { text: "Because you keep halving a sorted list." },
    });

    expect(result.state).toBe("unknown");
    expect(result.score).toBeUndefined();
    expect(result.detail?.awaitingReader).toBe(true);
  });

  it("keeps the answer's length and an unjudged rubric for the reader", () => {
    const result = evaluate({
      data: data({ marking: "person" }),
      answer: { text: "  Because it halves.  " },
    });

    expect(result.detail?.length).toBe(18);
    const marks = result.detail?.criteria as CriterionOutcome[];
    expect(marks.map((mark) => mark.met)).toEqual([undefined, undefined]);
    expect(marks.map((mark) => mark.label)).toEqual([
      "Mentions sorted order",
      "Mentions halving",
    ]);
  });

  it("scores a point per rubric line the words reach", () => {
    const result = evaluate({
      data: data(),
      answer: { text: "The list is sorted, so you can check the middle." },
    });

    expect(result.score).toEqual({ earned: 2, possible: 2 });
    expect(result.state).toBe("correct");
  });

  it("is partly right when only some lines are mentioned", () => {
    const result = evaluate({
      data: data(),
      answer: { text: "You check the middle value." },
    });

    expect(result.score).toEqual({ earned: 1, possible: 2 });
    expect(result.state).toBe("wrong");
  });

  it("counts a line by what it is worth", () => {
    const result = evaluate({
      data: data({
        criteria: [
          { id: "a", label: "A", keywords: ["sorted"], points: 3 },
          { id: "b", label: "B", keywords: ["middle"], points: 1 },
        ],
      }),
      answer: { text: "It is sorted." },
    });

    expect(result.score).toEqual({ earned: 3, possible: 4 });
  });

  it("says which lines were reached, for the report", () => {
    const result = evaluate({ data: data(), answer: { text: "sorted" } });

    const marks = result.detail?.criteria as CriterionOutcome[];
    expect(marks.map((mark) => [mark.criterionId, mark.met])).toEqual([
      ["sorted", true],
      ["halve", false],
    ]);
  });

  it("scores nothing out of nothing when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { mode: "skip" } }),
      answer: { text: "sorted and halved" },
    });

    expect(result.state).toBe("unknown");
    expect(result.score).toBeUndefined();
  });

  it("copes with no answer at all", () => {
    const result = evaluate({ data: data(), answer: undefined });

    expect(result.score).toEqual({ earned: 0, possible: 2 });
    expect(result.detail?.length).toBe(0);
  });

  /**
   * Everything mentioned out of nothing to mention is not a correct answer.
   * Built rather than parsed: the schema refuses to save this, so it can only
   * arrive in a hand-edited file — which is exactly when it must not pay out.
   */
  it("is not correct when the rubric is empty", () => {
    const result = evaluate({
      data: { ...data(), criteria: [] },
      answer: { text: "anything" },
    });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 0, possible: 0 });
  });
});
