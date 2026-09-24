import { describe, expect, it } from "vitest";
import {
  carryForward,
  DataSchema,
  displayRow,
  isPermutationOf,
  slotCountOf,
  withRow,
  type Data,
} from "./schema";

const base = {
  initial: ["5", "2", "8", "1", "9"],
  steps: [
    { id: "pass-1", label: "After pass 1", expected: ["2", "5", "1", "8", "9"] },
    { id: "pass-2", label: "After pass 2", expected: ["2", "1", "5", "8", "9"] },
  ],
};

const messages = (over: Record<string, unknown> = {}) =>
  (DataSchema.safeParse({ ...base, ...over }).error?.issues ?? []).map(
    (issue) => issue.message,
  );

describe("isPermutationOf", () => {
  it("accepts the same values reordered", () => {
    expect(isPermutationOf(["5", "2", "8"], ["8", "5", "2"])).toBe(true);
  });

  it("refuses a different length", () => {
    expect(isPermutationOf(["5", "2", "8"], ["5", "2"])).toBe(false);
  });

  it("refuses a value that was never there", () => {
    expect(isPermutationOf(["5", "2", "8"], ["5", "2", "9"])).toBe(false);
  });

  it("cares about how many of each value there are", () => {
    expect(isPermutationOf(["5", "5", "8"], ["5", "8", "8"])).toBe(false);
  });
});

describe("DataSchema", () => {
  it("accepts a rearrange task whose steps are permutations of the initial array", () => {
    expect(messages()).toEqual([]);
  });

  it("defaults to rearrange mode, indices shown, no case sensitivity", () => {
    const data = DataSchema.parse(base);
    expect(data.mode).toBe("rearrange");
    expect(data.showIndices).toBe(true);
    expect(data.caseSensitive).toBe(false);
    expect(data.partialCredit).toBe(true);
    expect(data.slots).toBeUndefined();
  });

  it("refuses a rearrange step with a value the initial array never had", () => {
    expect(
      messages({
        steps: [{ id: "pass-1", label: "", expected: ["2", "5", "1", "8", "99"] }],
      }).join(" "),
    ).toMatch(/only reorder the initial array/i);
  });

  it("refuses a rearrange step with the wrong number of values", () => {
    expect(
      messages({ steps: [{ id: "pass-1", label: "", expected: ["2", "5"] }] }).join(" "),
    ).toMatch(/only reorder the initial array/i);
  });

  it("does not apply the permutation rule in write mode", () => {
    // A stack shrinks and grows; its rows are not reorderings of anything.
    expect(
      messages({
        mode: "write",
        steps: [{ id: "s1", label: "pop()", expected: ["5", "2"] }],
      }),
    ).toEqual([]);
  });

  it("refuses two steps with one id", () => {
    expect(
      messages({
        steps: [base.steps[0], { ...base.steps[0], label: "again" }],
      }).join(" "),
    ).toMatch(/own id/i);
  });

  it("wants a starting array", () => {
    expect(messages({ initial: [] }).join(" ")).toMatch(/starting array/i);
  });

  it("wants at least one step", () => {
    expect(messages({ steps: [] }).join(" ")).toMatch(/at least one step/i);
  });

  it("leaves an ungraded task alone", () => {
    expect(
      messages({ initial: [], steps: [], evaluation: { mode: "skip" } }),
    ).toEqual([]);
  });
});

describe("slotCountOf", () => {
  const data = (over: Partial<Data> = {}): Data => DataSchema.parse({ ...base, ...over });

  it("uses the widest row already written", () => {
    expect(
      slotCountOf(
        data({
          mode: "write",
          initial: ["5", "2"],
          steps: [{ id: "a", label: "", expected: ["5", "2", "9"] }],
        }),
      ),
    ).toBe(3);
  });

  it("prefers an explicit slot count", () => {
    expect(slotCountOf(data({ slots: 6 }))).toBe(6);
  });
});

describe("carryForward", () => {
  const data = DataSchema.parse(base);

  it("starts from the initial array before anything is touched", () => {
    expect(carryForward(data, undefined, 0)).toEqual(data.initial);
  });

  it("carries the learner's own last row forward through untouched steps", () => {
    const answer = { rows: [["2", "5", "1", "8", "9"]] };
    expect(carryForward(data, answer, 1)).toEqual(["2", "5", "1", "8", "9"]);
  });

  it("reaches back past more than one untouched step", () => {
    const threeSteps = DataSchema.parse({
      ...base,
      steps: [...base.steps, { id: "pass-3", label: "", expected: base.steps[1].expected }],
    });
    const answer = { rows: [["2", "5", "1", "8", "9"]] };
    expect(carryForward(threeSteps, answer, 2)).toEqual(["2", "5", "1", "8", "9"]);
  });
});

describe("withRow", () => {
  const data = DataSchema.parse(base);

  it("fills in every earlier row that was still implicit", () => {
    const answer = withRow(data, undefined, 1, ["2", "1", "5", "8", "9"]);
    // Step 0 was never touched, but it is materialised rather than left a
    // hole — the initial array, since nothing came before it.
    expect(answer.rows[0]).toEqual(data.initial);
    expect(answer.rows[1]).toEqual(["2", "1", "5", "8", "9"]);
  });

  it("leaves an already-recorded earlier row alone", () => {
    const first = withRow(data, undefined, 0, ["2", "5", "1", "8", "9"]);
    const second = withRow(data, first, 1, ["2", "1", "5", "8", "9"]);
    expect(second.rows[0]).toEqual(["2", "5", "1", "8", "9"]);
  });
});

describe("displayRow", () => {
  it("never pads a rearrange row — a swap can't add or remove a box", () => {
    const data = DataSchema.parse(base);
    expect(displayRow(data, undefined, 0)).toEqual(data.initial);
  });

  it("pads a write row out to the slot count with blanks", () => {
    const data = DataSchema.parse({
      ...base,
      mode: "write",
      initial: ["5", "2"],
      steps: [{ id: "a", label: "push(9)", expected: ["5", "2", "9", "1"] }],
    });
    // The widest row written is 4, so even the two-value starting array shows
    // four boxes — the two it does not need yet, blank.
    expect(displayRow(data, undefined, 0)).toEqual(["5", "2", "", ""]);
  });
});
