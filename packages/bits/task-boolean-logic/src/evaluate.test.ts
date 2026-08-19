import { describe, expect, it } from "vitest";
import { askedOf, cellStates, evaluate, solutionOf } from "./evaluate";
import { parse } from "./expression";
import { DataSchema, rowsOf, type Answer, type Data } from "./schema";

const expression = (source: string) => {
  const result = parse(source);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const data = (over: Record<string, unknown> = {}): Data =>
  DataSchema.parse({
    instruction: "Complete the output column.",
    variables: ["A", "B"],
    columns: [{ id: "out", label: "", expression: expression("A ∧ ¬B"), given: false }],
    ...over,
  });

/** Every cell filled in with `value(row)`. */
const fill = (from: Data, value: (rowId: string) => boolean | null): Answer => ({
  cells: Object.fromEntries(
    rowsOf(from).map((row) => [
      row.id,
      Object.fromEntries(from.columns.map((column) => [column.id, value(row.id)])),
    ]),
  ),
});

describe("rowsOf", () => {
  it("makes a row per combination, counting up in binary", () => {
    expect(rowsOf(data()).map((row) => row.id)).toEqual(["00", "01", "10", "11"]);
  });

  it("gives three variables eight rows", () => {
    expect(rowsOf(data({ variables: ["A", "B", "C"] }))).toHaveLength(8);
  });

  it("can count with the first variable changing fastest instead", () => {
    const rows = rowsOf(data({ rowOrder: "reversed" }));
    expect(rows.map((row) => row.id)).toEqual(["00", "10", "01", "11"]);
  });

  it("names the row by its own bits, so it survives everything but a rename", () => {
    const row = rowsOf(data())[2];
    expect(row.id).toBe("10");
    expect(row.inputs).toEqual({ A: true, B: false });
  });

  it("has nothing to show without variables", () => {
    // Built rather than parsed: the schema refuses to save this, which is the
    // point — the form still has to render it on the way to a valid table.
    expect(rowsOf({ ...data(), variables: [] })).toEqual([]);
  });
});

describe("solutionOf", () => {
  /**
   * There is no stored answer key. The table is worked out from the expression
   * every time, which is why it cannot disagree with the heading above it.
   */
  it("works the whole column out from the expression", () => {
    expect(solutionOf(data())).toEqual({
      "00": { out: false },
      "01": { out: false },
      "10": { out: true },
      "11": { out: false },
    });
  });
});

describe("askedOf", () => {
  it("asks for every cell of every column that is not given", () => {
    expect(askedOf(data())).toHaveLength(4);
  });

  /** A worked step is part of the question; paying for it scores reading. */
  it("never asks for a column the author filled in", () => {
    const withStep = data({
      columns: [
        { id: "step", label: "", expression: expression("¬B"), given: true },
        { id: "out", label: "", expression: expression("A ∧ ¬B"), given: false },
      ],
    });

    expect(askedOf(withStep).map((cell) => cell.columnId)).toEqual([
      "out",
      "out",
      "out",
      "out",
    ]);
  });
});

describe("cellStates", () => {
  it("tells an unanswered cell from a wrong one", () => {
    const answer: Answer = { cells: { "10": { out: false }, "11": { out: null } } };

    const states = cellStates(data(), answer);
    expect(states["10"].out).toBe("wrong");
    expect(states["11"].out).toBe("blank");
    expect(states["00"].out).toBe("blank");
  });

  it("marks a right cell right", () => {
    const answer: Answer = { cells: { "10": { out: true } } };
    expect(cellStates(data(), answer)["10"].out).toBe("correct");
  });
});

describe("evaluate", () => {
  it("marks a whole correct table correct", () => {
    const solution = solutionOf(data());
    const answer = fill(data(), (rowId) => solution[rowId].out);

    const result = evaluate({ data: data(), answer });
    expect(result.state).toBe("correct");
    expect(result.score).toEqual({ earned: 4, possible: 4 });
  });

  it("gives a point per cell", () => {
    // All false: right for three rows of four, wrong for `10`.
    const result = evaluate({ data: data(), answer: fill(data(), () => false) });

    expect(result.state).toBe("wrong");
    expect(result.score).toEqual({ earned: 3, possible: 4 });
  });

  it("can be all or nothing instead", () => {
    const strict = data({ partialCredit: false });
    const result = evaluate({ data: strict, answer: fill(strict, () => false) });

    expect(result.score).toEqual({ earned: 0, possible: 1 });
  });

  it("counts an unanswered cell as not earned, and not as wrong", () => {
    const result = evaluate({ data: data(), answer: fill(data(), () => null) });

    expect(result.score).toEqual({ earned: 0, possible: 4 });
    const states = result.detail?.cells as Record<string, Record<string, string>>;
    expect(Object.values(states).every((row) => row.out === "blank")).toBe(true);
  });

  it("never scores a column the author filled in", () => {
    const withStep = data({
      columns: [
        { id: "step", label: "", expression: expression("¬B"), given: true },
        { id: "out", label: "", expression: expression("A ∧ ¬B"), given: false },
      ],
    });
    const solution = solutionOf(withStep);
    const answer: Answer = {
      cells: Object.fromEntries(
        rowsOf(withStep).map((row) => [
          row.id,
          // Deliberately wrong in the given column; it is not being asked.
          { step: !solution[row.id].step, out: solution[row.id].out },
        ]),
      ),
    };

    const result = evaluate({ data: withStep, answer });
    expect(result.score).toEqual({ earned: 4, possible: 4 });
    expect(result.state).toBe("correct");
  });

  it("scores nothing out of nothing when grading is switched off", () => {
    const result = evaluate({
      data: data({ evaluation: { mode: "skip" } }),
      answer: fill(data(), () => true),
    });

    expect(result.state).toBe("unknown");
    expect(result.score).toBeUndefined();
  });

  it("copes with no answer at all", () => {
    const result = evaluate({ data: data(), answer: undefined });
    expect(result.score).toEqual({ earned: 0, possible: 4 });
  });
});
