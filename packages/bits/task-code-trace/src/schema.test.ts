import { describe, expect, it } from "vitest";
import { DataSchema, linesOf } from "./schema";

const base = {
  code: "let total = 0;\nfor (const value of [1, 2, 3]) total += value;\nprint(total);",
  columns: [
    { id: "total", name: "total", kind: "value" as const },
    { id: "next", name: "next line", kind: "line" as const },
  ],
  checkpoints: [
    {
      id: "start",
      label: "before the loop",
      line: 1,
      expected: { total: "0", next: "2" },
    },
  ],
};

const messages = (over: Record<string, unknown> = {}) =>
  (DataSchema.safeParse({ ...base, ...over }).error?.issues ?? []).map(
    (issue) => issue.message,
  );

describe("linesOf", () => {
  it("numbers the lines as the listing shows them", () => {
    expect(linesOf("a\nb\nc")).toEqual(["a", "b", "c"]);
  });

  it("does not invent a line for a trailing newline", () => {
    // A file that ends in a newline has no last empty line, and a checkpoint
    // pointing at one would be pointing at nothing.
    expect(linesOf("a\nb\n")).toEqual(["a", "b"]);
  });

  it("keeps a blank line in the middle", () => {
    expect(linesOf("a\n\nb")).toEqual(["a", "", "b"]);
  });
});

describe("DataSchema", () => {
  it("accepts a table that can be answered", () => {
    expect(messages()).toEqual([]);
  });

  it("wants a program", () => {
    expect(messages({ code: "  " }).join(" ")).toMatch(/add the program/i);
  });

  it("wants a column and a checkpoint", () => {
    expect(messages({ columns: [], checkpoints: [] }).join(" ")).toMatch(
      /at least one column/i,
    );
    expect(messages({ checkpoints: [] }).join(" ")).toMatch(
      /at least one checkpoint/i,
    );
  });

  it("wants every column headed", () => {
    expect(
      messages({ columns: [{ id: "a", name: "", kind: "value" }] }).join(" "),
    ).toMatch(/give the column a heading/i);
  });

  it("refuses two columns with one id", () => {
    expect(
      messages({
        columns: [
          { id: "total", name: "a", kind: "value" },
          { id: "total", name: "b", kind: "value" },
        ],
      }).join(" "),
    ).toMatch(/own id/i);
  });

  it("refuses two checkpoints with one id", () => {
    expect(
      messages({
        checkpoints: [base.checkpoints[0], { ...base.checkpoints[0], label: "again" }],
      }).join(" "),
    ).toMatch(/own id/i);
  });

  it("refuses a checkpoint anchored past the end of the program", () => {
    expect(messages({ checkpoints: [{ ...base.checkpoints[0], line: 9 }] }).join(" "))
      .toMatch(/no line 9/i);
  });

  it("refuses a next-line answer that is not a line", () => {
    // The learner chooses from the listing, so an expected value outside it
    // could never be picked — the task would be unanswerable.
    expect(
      messages({
        checkpoints: [
          { ...base.checkpoints[0], expected: { total: "0", next: "12" } },
        ],
      }).join(" "),
    ).toMatch(/is not one of the program's 3 lines/i);
  });

  it("accepts a blank next-line cell", () => {
    // Blank is a real answer: the program has stopped.
    expect(
      messages({
        checkpoints: [{ ...base.checkpoints[0], expected: { total: "0", next: "" } }],
      }),
    ).toEqual([]);
  });

  it("refuses a table with nothing to get right", () => {
    expect(
      messages({
        checkpoints: [{ id: "start", label: "at the end", expected: {} }],
      }).join(" "),
    ).toMatch(/cannot be answered wrongly/i);
  });

  it("leaves an ungraded task alone", () => {
    // Nothing here is marked, so none of it has to be answerable.
    expect(
      messages({
        code: "",
        columns: [],
        checkpoints: [],
        evaluation: { mode: "skip" },
      }),
    ).toEqual([]);
  });
});
